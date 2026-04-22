import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { google, calendar_v3 } from "googleapis";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "primary";

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getGoogleAuth() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    return new google.auth.GoogleAuth({
      credentials: JSON.parse(serviceAccountJson),
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
  }
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? "urn:ietf:wg:oauth:2.0:oob"
  );
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2;
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart);
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// Strip our standard template sections and return anything extra.
// Template format (from syncAppointmentToGoogle):
//   Access Info: ...
//   Service Notes: ...
//   Contact Dossier: https://...
function extractAddedNotes(description: string | null | undefined): string | null {
  if (!description) return null;
  const TEMPLATE_PREFIXES = ["Access Info:", "Service Notes:", "Contact Dossier:"];
  const extra = description
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      if (TEMPLATE_PREFIXES.some((p) => l.startsWith(p))) return false;
      if (l.includes("/pro/contacts/")) return false;
      return true;
    });
  return extra.length > 0 ? extra.join("\n") : null;
}

// ─── Core sync logic ──────────────────────────────────────────────────────────

type CrmEvent = {
  id: string;
  contact_id: string;
  title: string | null;
  body: string | null;
  metadata: Record<string, string>;
};

async function processGoogleEvent(
  gEvent: calendar_v3.Schema$Event,
  supabase: SupabaseClient
) {
  const googleEventId = gEvent.id;
  if (!googleEventId) return;

  // Find the CRM appointment linked to this Google event
  const { data: rows } = await supabase
    .from("timeline_events")
    .select("id, contact_id, title, body, metadata")
    .eq("event_type", "appointment_scheduled")
    .filter("metadata->>google_event_id", "eq", googleEventId)
    .limit(1);

  if (!rows || rows.length === 0) return;
  const crm = rows[0] as CrmEvent;

  // Resolve contact name once for use in flag messages
  const { data: contact } = await supabase
    .from("contacts")
    .select("name, email")
    .eq("id", crm.contact_id)
    .single();
  const contactName = contact?.name ?? contact?.email ?? "Unknown Contact";

  // ── Deleted / cancelled ───────────────────────────────────────────────────
  if (gEvent.status === "cancelled") {
    await ensureFlag(supabase, {
      flagType:      "calendar_discrepancy",
      referenceId:   crm.id,
      referenceType: "timeline_event",
      message:       `Google Calendar event for "${crm.title ?? "appointment"}" (${contactName}) was deleted outside the CRM.`,
    });

    await supabase.from("timeline_events").insert({
      contact_id:  crm.contact_id,
      event_type:  "calendar_discrepancy",
      title:       "Calendar Discrepancy",
      body:        `The appointment "${crm.title ?? "appointment"}" was deleted on Google Calendar outside the CRM. Please reconcile.`,
      metadata:    { google_event_id: googleEventId, discrepancy_type: "deleted" },
      created_by:  "system",
    });
    return;
  }

  const newStart = gEvent.start?.dateTime;
  const newEnd   = gEvent.end?.dateTime;
  if (!newStart || !newEnd) return;

  // ── Moved (time changed) ──────────────────────────────────────────────────
  const oldStart = crm.metadata?.start_time;
  const oldEnd   = crm.metadata?.end_time;
  const wasMoved = oldStart !== newStart || oldEnd !== newEnd;

  if (wasMoved) {
    // Update stored metadata and body with new times
    await supabase
      .from("timeline_events")
      .update({
        body:     `${crm.metadata?.service ?? "Service"} rescheduled to ${fmtTime(newStart)}.`,
        metadata: { ...crm.metadata, start_time: newStart, end_time: newEnd, last_synced: new Date().toISOString() },
      })
      .eq("id", crm.id);

    // Log the reschedule in the contact's activity timeline
    await supabase.from("timeline_events").insert({
      contact_id:  crm.contact_id,
      event_type:  "appointment_scheduled",
      title:       "Appointment rescheduled via Google Calendar",
      body:        `Moved from ${oldStart ? fmtTime(oldStart) : "unknown"} to ${fmtTime(newStart)}.`,
      metadata:    { google_event_id: googleEventId, start_time: newStart, end_time: newEnd },
      created_by:  "google_calendar",
    });

    // Update the linked vessel's last_service_date to the new appointment date
    const serviceDate = newStart.split("T")[0];
    const vesselId    = crm.metadata?.vessel_id;
    if (vesselId) {
      await supabase
        .from("vessels")
        .update({ last_service_date: serviceDate })
        .eq("id", vesselId);
    } else {
      // Fall back: update the contact's most recently added vessel
      const { data: vessels } = await supabase
        .from("vessels")
        .select("id")
        .eq("owner_id", crm.contact_id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (vessels && vessels.length > 0) {
        await supabase
          .from("vessels")
          .update({ last_service_date: serviceDate })
          .eq("id", vessels[0].id);
      }
    }

    // Conflict check: does the new time overlap any other CRM appointment?
    const { data: others } = await supabase
      .from("timeline_events")
      .select("id, contact_id, metadata, title")
      .eq("event_type", "appointment_scheduled")
      .neq("id", crm.id);

    for (const other of others ?? []) {
      const om = other.metadata as Record<string, string>;
      if (!om?.start_time || !om?.end_time) continue;
      if (!overlaps(newStart, newEnd, om.start_time, om.end_time)) continue;

      const { data: otherContact } = await supabase
        .from("contacts")
        .select("name, email")
        .eq("id", other.contact_id)
        .single();
      const otherName = otherContact?.name ?? otherContact?.email ?? "Unknown Contact";

      await ensureFlag(supabase, {
        flagType:      "scheduling_conflict",
        referenceId:   crm.id,
        referenceType: "timeline_event",
        message:       `Google Calendar move created a scheduling conflict for ${contactName} — overlaps with appointment for ${otherName} at ${fmtTime(newStart)}.`,
      });

      await supabase.from("timeline_events").insert({
        contact_id:  crm.contact_id,
        event_type:  "calendar_discrepancy",
        title:       "Scheduling Conflict",
        body:        `Appointment rescheduled to ${fmtTime(newStart)} conflicts with an existing appointment for ${otherName}.`,
        metadata:    { google_event_id: googleEventId, conflict_event_id: other.id },
        created_by:  "system",
      });
    }
  }

  // ── Mirror description notes to CRM ───────────────────────────────────────
  const addedNotes = extractAddedNotes(gEvent.description);
  if (addedNotes) {
    // Deduplicate: don't re-insert a note with identical body
    const { data: existingNote } = await supabase
      .from("timeline_events")
      .select("id")
      .eq("contact_id", crm.contact_id)
      .eq("event_type", "note")
      .filter("metadata->>google_event_id", "eq", googleEventId)
      .eq("body", addedNotes)
      .maybeSingle();

    if (!existingNote) {
      await supabase.from("timeline_events").insert({
        contact_id:  crm.contact_id,
        event_type:  "note",
        title:       "Note synced from Google Calendar",
        body:        addedNotes,
        metadata:    { google_event_id: googleEventId, source: "google_calendar" },
        created_by:  "google_calendar",
      });
    }
  }
}

// Upsert a system flag — only inserts if no unresolved flag of the same type
// already exists for this reference_id.
async function ensureFlag(
  supabase: SupabaseClient,
  opts: { flagType: string; referenceId: string; referenceType: string; message: string }
) {
  const { data: existing } = await supabase
    .from("system_flags")
    .select("id")
    .eq("flag_type", opts.flagType)
    .eq("reference_id", opts.referenceId)
    .eq("resolved", false)
    .maybeSingle();

  if (existing) return;

  await supabase.from("system_flags").insert({
    flag_type:      opts.flagType,
    reference_id:   opts.referenceId,
    reference_type: opts.referenceType,
    message:        opts.message,
  });
}

// ─── Route handlers ───────────────────────────────────────────────────────────

// POST  — receives push notifications from Google Calendar
export async function POST(request: NextRequest) {
  // Always respond 200 immediately so Google doesn't retry and treat us as down.
  // Process asynchronously inside the same request lifetime.

  const channelToken = request.headers.get("x-goog-channel-token");
  const expectedToken = process.env.GOOGLE_WEBHOOK_TOKEN;
  if (expectedToken && channelToken !== expectedToken) {
    // Silently accept to avoid leaking that the endpoint exists, but don't process.
    return new NextResponse(null, { status: 200 });
  }

  const resourceState = request.headers.get("x-goog-resource-state");

  // "sync" is the initial handshake Google sends on channel registration.
  if (resourceState === "sync") {
    return new NextResponse(null, { status: 200 });
  }

  // Only process "exists" (created / updated) — "not_exists" (deleted) is
  // caught below by checking gEvent.status === "cancelled".
  if (resourceState !== "exists" && resourceState !== "not_exists") {
    return new NextResponse(null, { status: 200 });
  }

  try {
    const auth     = getGoogleAuth();
    const calendar = google.calendar({ version: "v3", auth });

    // Fetch events updated in the last 3 minutes.
    // This window is wide enough to tolerate any delivery lag while staying
    // tight enough that we don't re-process stale events on every notification.
    const updatedMin = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    const { data: eventList } = await calendar.events.list({
      calendarId:   CALENDAR_ID,
      updatedMin,
      singleEvents: true,
      maxResults:   50,
      showDeleted:  true,
    });

    const supabase = db();

    await Promise.all(
      (eventList.items ?? []).map((ev) => processGoogleEvent(ev, supabase))
    );
  } catch (err) {
    console.error("[calendar-webhook] processing error:", err);
    // Still return 200 — a 5xx causes Google to retry and could create duplicate flags.
  }

  return new NextResponse(null, { status: 200 });
}

// GET  — one-time setup: registers the watch channel with Google Calendar.
// Call this once after deploy:
//   curl -H "x-api-key: <INGEST_API_KEY>" https://yourdomain.com/api/webhooks/google-calendar
// Channels expire after 7 days max; re-call to renew.
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.INGEST_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/google-calendar`;

  try {
    const auth     = getGoogleAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const res = await calendar.events.watch({
      calendarId: CALENDAR_ID,
      requestBody: {
        id:      `northwake-crm-${Date.now()}`,
        type:    "web_hook",
        address: webhookUrl,
        token:   process.env.GOOGLE_WEBHOOK_TOKEN ?? "",
      },
    });

    return NextResponse.json({
      ok:         true,
      channelId:  res.data.id,
      resourceId: res.data.resourceId,
      expiration: res.data.expiration
        ? new Date(parseInt(res.data.expiration)).toISOString()
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to register watch channel.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
