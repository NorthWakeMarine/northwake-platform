import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { detectCalendarDiscrepancies } from "@/lib/google-calendar";
import { google } from "googleapis";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

function isAuthorized(request: Request): boolean {
  // Vercel cron sends: Authorization: Bearer <CRON_SECRET>
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  // Manual calls send: x-api-key: <INGEST_API_KEY>
  const key = (request as Request & { headers: Headers }).headers.get("x-api-key");
  if (key && key === process.env.INGEST_API_KEY) return true;
  return false;
}

// ── Webhook auto-renewal ───────────────────────────────────────────────────────
// Stores channel expiration in system_flags (flag_type = 'calendar_webhook_channel').
// Re-registers when expiration is within 2 days or no record exists.

async function renewWebhookIfNeeded(supabase: ReturnType<typeof db>): Promise<string> {
  const { data: existing } = await supabase
    .from("system_flags")
    .select("id, message, created_at")
    .eq("flag_type", "calendar_webhook_channel")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const expiresAt = existing?.message ? new Date(existing.message) : null;
  const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  if (expiresAt && expiresAt > twoDaysFromNow) {
    return `webhook_ok (expires ${expiresAt.toISOString()})`;
  }

  // Re-register the channel
  const subject   = process.env.GOOGLE_CALENDAR_SUBJECT;
  const CAL_SCOPE = "https://www.googleapis.com/auth/calendar";
  const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "primary";

  let auth;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    auth = new google.auth.GoogleAuth({
      credentials:   JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes:        [CAL_SCOPE],
      clientOptions: subject ? { subject } : undefined,
    });
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    auth = new google.auth.JWT({
      email:   process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key:     process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes:  [CAL_SCOPE],
      subject: subject,
    });
  } else {
    return "webhook_skipped (no service account configured)";
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/google-calendar`;
  const calendar   = google.calendar({ version: "v3", auth });

  const res = await calendar.events.watch({
    calendarId: CALENDAR_ID,
    requestBody: {
      id:      `northwake-crm-${Date.now()}`,
      type:    "web_hook",
      address: webhookUrl,
      token:   process.env.GOOGLE_WEBHOOK_TOKEN ?? "",
    },
  });

  const newExpiry = res.data.expiration
    ? new Date(parseInt(res.data.expiration)).toISOString()
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Upsert the expiration record
  if (existing) {
    await supabase
      .from("system_flags")
      .update({ message: newExpiry, resolved: false })
      .eq("id", existing.id);
  } else {
    await supabase.from("system_flags").insert({
      flag_type:      "calendar_webhook_channel",
      reference_type: "system",
      reference_id:   "calendar_webhook",
      message:        newExpiry,
      resolved:       false,
    });
  }

  return `webhook_renewed (expires ${newExpiry})`;
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = db();
  const results: Record<string, unknown> = {};

  // 1. Auto-renew webhook channel
  try {
    results.webhook = await renewWebhookIfNeeded(supabase);
  } catch (err) {
    results.webhook_error = err instanceof Error ? err.message : String(err);
  }

  // 2. Discrepancy detection
  const { data: events, error } = await supabase
    .from("timeline_events")
    .select("id, contact_id, metadata, title")
    .eq("event_type", "appointment_scheduled")
    .not("metadata->google_event_id", "is", null);

  if (error) {
    return NextResponse.json({ ...results, error: error.message }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ ...results, checked: 0, flagged: 0 });
  }

  type EventRow = { id: string; contact_id: string; metadata: Record<string, string>; title: string | null };
  const rows     = events as EventRow[];
  const googleIds = rows.map((e) => e.metadata?.google_event_id).filter(Boolean);

  const discrepancies = await detectCalendarDiscrepancies(googleIds);
  let flagged = 0;

  for (const disc of discrepancies) {
    const source = rows.find((e) => e.metadata?.google_event_id === disc.googleEventId);
    if (!source) continue;

    const { data: existing } = await supabase
      .from("timeline_events")
      .select("id")
      .eq("contact_id", source.contact_id)
      .eq("event_type", "calendar_discrepancy")
      .contains("metadata", { google_event_id: disc.googleEventId })
      .maybeSingle();

    if (existing) continue;

    await supabase.from("timeline_events").insert({
      contact_id:  source.contact_id,
      event_type:  "calendar_discrepancy",
      title:       "Calendar Discrepancy",
      body:        `The Google Calendar event for "${source.title ?? "appointment"}" was ${disc.status} outside the CRM. Please reconcile.`,
      metadata:    { google_event_id: disc.googleEventId, discrepancy_type: disc.status },
      created_by:  "system",
    });

    flagged++;
  }

  return NextResponse.json({ ...results, checked: googleIds.length, flagged });
}
