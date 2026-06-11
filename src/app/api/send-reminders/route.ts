import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

function formatEventDate(start: string): string {
  const d = start.includes("T") ? new Date(start) : new Date(start + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = svc();

  // Target: events occurring exactly 2 days from now
  const now = new Date();
  const targetStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  const targetEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);

  // 1. Fetch all recurring calendar links with contact phone numbers
  const { data: links, error: linkErr } = await supabase
    .from("calendar_contact_links")
    .select("gcal_event_id, contact_id, service_label, contacts(name, phone)")
    .not("recurrence_rule", "is", null);

  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 });
  if (!links || links.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, message: "No recurring links configured." });
  }

  type LinkInfo = {
    contactId: string;
    contactName: string;
    contactPhone: string;
    serviceLabel: string;
  };

  const linkBySeriesId = new Map<string, LinkInfo>();
  for (const l of links) {
    const c = l.contacts as unknown as { name: string | null; phone: string | null } | null;
    if (!c?.phone) continue;
    linkBySeriesId.set(l.gcal_event_id, {
      contactId:    l.contact_id,
      contactName:  c.name ?? "",
      contactPhone: c.phone,
      serviceLabel: l.service_label ?? "scheduled work",
    });
  }

  if (linkBySeriesId.size === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, message: "No recurring links with phone numbers found." });
  }

  // 2. Fetch GCal events for the target day
  let gcalEvents: { id: string; start: string; recurringEventId?: string }[] = [];
  try {
    const { listEvents } = await import("@/lib/google-calendar");
    gcalEvents = await listEvents(targetStart, targetEnd);
  } catch {
    return NextResponse.json({ error: "Failed to fetch Google Calendar events." }, { status: 500 });
  }

  // 3. Match events to recurring links
  type WorkItem = {
    eventId: string;
    contactId: string;
    contactName: string;
    contactPhone: string;
    eventDate: string;
  };

  const workItems: WorkItem[] = [];
  for (const ev of gcalEvents) {
    const link = linkBySeriesId.get(ev.id) ?? (ev.recurringEventId ? linkBySeriesId.get(ev.recurringEventId) : undefined);
    if (!link) continue;
    workItems.push({
      eventId:      ev.id,
      contactId:    link.contactId,
      contactName:  link.contactName,
      contactPhone: link.contactPhone,
      eventDate:    ev.start,
    });
  }

  if (workItems.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, message: "No recurring events found for target date." });
  }

  // 4. Dedup: skip events already reminded
  const contactIds = [...new Set(workItems.map(w => w.contactId))];
  const { data: existingReminders } = await supabase
    .from("timeline_events")
    .select("metadata")
    .eq("event_type", "sms")
    .eq("created_by", "cron")
    .in("contact_id", contactIds);

  const alreadySent = new Set<string>(
    (existingReminders ?? [])
      .map(e => (e.metadata as { reminder_gcal_event_id?: string } | null)?.reminder_gcal_event_id)
      .filter(Boolean) as string[]
  );

  const toSend = workItems.filter(w => !alreadySent.has(w.eventId));

  // 5. Send reminders
  const { sendSMS } = await import("@/lib/openphone");
  const { splitName } = await import("@/lib/openphone");

  let sent = 0;
  const failed: string[] = [];

  for (const w of toSend) {
    try {
      const firstName = splitName(w.contactName).firstName || w.contactName;
      const dateLabel = formatEventDate(w.eventDate);
      const message = `NorthWake Marine: ${firstName}, Sending out a reminder that we will be out on ${dateLabel} for your scheduled work. Thank You.`;

      await sendSMS(w.contactPhone, message);

      await supabase.from("timeline_events").insert({
        contact_id: w.contactId,
        event_type: "sms",
        title:      "Appointment Reminder Sent",
        body:       message,
        metadata:   {
          direction:             "outbound",
          reminder:              true,
          reminder_gcal_event_id: w.eventId,
          to_number:             w.contactPhone,
        },
        created_by: "cron",
      });

      sent++;
    } catch (err) {
      failed.push(`${w.contactName} (${w.contactPhone}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 6. Log summary
  const targetDateStr = targetStart.toISOString().slice(0, 10);
  await supabase.from("system_flags").upsert({
    key:        `sms_reminders_${targetDateStr}`,
    value:      { sent, skipped: workItems.length - toSend.length, failed, target_date: targetDateStr },
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });

  return NextResponse.json({ sent, skipped: workItems.length - toSend.length, failed, target_date: targetDateStr });
}
