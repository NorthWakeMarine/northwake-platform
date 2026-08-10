import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

// Daily cron — finds "pipeline_reminder" calendar events occurring today and
// moves the linked contact's pipeline_stage back to "discovery".
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = svc();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const { data: links, error: linkErr } = await supabase
    .from("calendar_contact_links")
    .select("gcal_event_id, contact_id, contacts(name)")
    .eq("event_type", "pipeline_reminder");

  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 });
  if (!links || links.length === 0) {
    return NextResponse.json({ moved: 0, skipped: 0, message: "No pipeline reminders configured." });
  }

  type LinkInfo = { contactId: string; contactName: string | null };
  const linkBySeriesId = new Map<string, LinkInfo>();
  for (const l of links) {
    const c = l.contacts as unknown as { name: string | null } | null;
    linkBySeriesId.set(l.gcal_event_id, { contactId: l.contact_id, contactName: c?.name ?? null });
  }

  let gcalEvents: { id: string; start: string; recurringEventId?: string }[] = [];
  try {
    const { listEvents } = await import("@/lib/google-calendar");
    gcalEvents = await listEvents(todayStart, todayEnd);
  } catch {
    return NextResponse.json({ error: "Failed to fetch Google Calendar events." }, { status: 500 });
  }

  type DueItem = { eventId: string; contactId: string; contactName: string | null };
  const due: DueItem[] = [];
  for (const ev of gcalEvents) {
    const link = linkBySeriesId.get(ev.id) ?? (ev.recurringEventId ? linkBySeriesId.get(ev.recurringEventId) : undefined);
    if (link) due.push({ eventId: ev.id, contactId: link.contactId, contactName: link.contactName });
  }

  if (due.length === 0) {
    return NextResponse.json({ moved: 0, skipped: 0, message: "No reminders due today." });
  }

  // Dedup: skip any instance already processed (e.g. cron re-run same day)
  const contactIds = [...new Set(due.map((d) => d.contactId))];
  const { data: existing } = await supabase
    .from("timeline_events")
    .select("metadata")
    .eq("event_type", "pipeline_reminder")
    .in("contact_id", contactIds);

  const alreadyDone = new Set<string>(
    (existing ?? [])
      .map((e) => (e.metadata as { gcal_event_id?: string } | null)?.gcal_event_id)
      .filter(Boolean) as string[]
  );

  let moved = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const item of due) {
    if (alreadyDone.has(item.eventId)) { skipped++; continue; }
    try {
      await supabase.from("contacts").update({
        pipeline_stage: "discovery",
        stage_entered_at: new Date().toISOString(),
      }).eq("id", item.contactId);

      await supabase.from("timeline_events").insert({
        contact_id: item.contactId,
        event_type: "pipeline_reminder",
        title: "Recurring reminder — moved to Discovery",
        body: "Automatic recurring pipeline reminder triggered.",
        metadata: { gcal_event_id: item.eventId },
        created_by: "cron",
      });

      moved++;
    } catch (err) {
      failed.push(`${item.contactName ?? item.contactId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ moved, skipped, failed });
}
