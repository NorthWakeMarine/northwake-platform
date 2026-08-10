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

function getAlertPhoneNumbers(): string[] {
  return (process.env.ALERT_PHONE_NUMBERS ?? "")
    .split(",")
    .map(p => p.trim())
    .filter(Boolean);
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = svc();

  // Customer reminder fires for events exactly 2 days out; the internal
  // heads-up fires 1 day before that (3 days out), so staff know a day
  // ahead of time who's about to get texted.
  const now = new Date();
  const reminderStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  const reminderEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
  const warningStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
  const warningEnd    = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4);

  // 1. Fetch all calendar links with the reminder toggle on and a contact phone number
  const { data: links, error: linkErr } = await supabase
    .from("calendar_contact_links")
    .select("gcal_event_id, contact_id, service_label, contacts(name, phone)")
    .eq("sms_reminder_enabled", true);

  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 });
  if (!links || links.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, message: "No links with reminders enabled." });
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
    return NextResponse.json({ sent: 0, skipped: 0, message: "No links with phone numbers found." });
  }

  // 2. Fetch GCal events spanning both target days in one call
  let gcalEvents: { id: string; start: string; recurringEventId?: string }[] = [];
  try {
    const { listEvents } = await import("@/lib/google-calendar");
    gcalEvents = await listEvents(reminderStart, warningEnd);
  } catch {
    return NextResponse.json({ error: "Failed to fetch Google Calendar events." }, { status: 500 });
  }

  function matchLink(ev: { id: string; recurringEventId?: string }): LinkInfo | undefined {
    return linkBySeriesId.get(ev.id) ?? (ev.recurringEventId ? linkBySeriesId.get(ev.recurringEventId) : undefined);
  }

  function inWindow(start: string, from: Date, to: Date): boolean {
    const d = start.includes("T") ? new Date(start) : new Date(start + "T12:00:00");
    return d >= from && d < to;
  }

  // 3. Match events to links, split by which window they fall in
  type WorkItem = {
    eventId: string;
    contactId: string;
    contactName: string;
    contactPhone: string;
    eventDate: string;
  };

  const reminderItems: WorkItem[] = [];
  const warningItems: WorkItem[] = [];
  for (const ev of gcalEvents) {
    const link = matchLink(ev);
    if (!link) continue;
    const item: WorkItem = {
      eventId:      ev.id,
      contactId:    link.contactId,
      contactName:  link.contactName,
      contactPhone: link.contactPhone,
      eventDate:    ev.start,
    };
    if (inWindow(ev.start, reminderStart, reminderEnd)) reminderItems.push(item);
    else if (inWindow(ev.start, warningStart, warningEnd)) warningItems.push(item);
  }

  // 4. Dedup: skip customer reminders already sent
  const contactIds = [...new Set(reminderItems.map(w => w.contactId))];
  const { data: existingReminders } = contactIds.length
    ? await supabase
        .from("timeline_events")
        .select("metadata")
        .eq("event_type", "sms")
        .eq("created_by", "cron")
        .in("contact_id", contactIds)
    : { data: [] };

  const alreadySent = new Set<string>(
    (existingReminders ?? [])
      .map(e => (e.metadata as { reminder_gcal_event_id?: string } | null)?.reminder_gcal_event_id)
      .filter(Boolean) as string[]
  );

  const toSend = reminderItems.filter(w => !alreadySent.has(w.eventId));

  // 4b. Honor "No <Name>" skip requests staff sent in reply to yesterday's
  // internal warning text (see handleInboundSms in the Quo webhook)
  const { data: skipRows } = toSend.length
    ? await supabase
        .from("reminder_pending")
        .select("gcal_event_id")
        .in("gcal_event_id", toSend.map(w => w.eventId))
        .eq("skipped", true)
    : { data: [] };
  const skippedEventIds = new Set((skipRows ?? []).map(r => r.gcal_event_id));

  // 5. Send customer reminders
  const { sendSMS, splitName } = await import("@/lib/openphone");

  let sent = 0;
  let skippedByStaff = 0;
  const failed: string[] = [];

  for (const w of toSend) {
    if (skippedEventIds.has(w.eventId)) {
      skippedByStaff++;
      await supabase.from("timeline_events").insert({
        contact_id: w.contactId,
        event_type: "sms",
        title:      "Appointment Reminder Skipped",
        body:       "Skipped per staff reply to the internal heads-up text.",
        metadata:   { direction: "outbound", reminder: true, reminder_gcal_event_id: w.eventId, skipped: true },
        created_by: "cron",
      });
      continue;
    }

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

  // Clean up processed pending rows (sent, failed, or skipped — no longer pending)
  if (toSend.length > 0) {
    await supabase.from("reminder_pending").delete().in("gcal_event_id", toSend.map(w => w.eventId));
  }

  // 6. Log reminder summary (contact_id null = system-wide log entry, not tied
  // to one customer — mirrors the pattern used for unrecognized-caller events)
  const reminderDateStr = reminderStart.toISOString().slice(0, 10);
  await supabase.from("timeline_events").insert({
    contact_id: null,
    event_type: "cron_log",
    title:      "SMS reminder run",
    body:       `Sent ${sent}, already-sent skipped ${reminderItems.length - toSend.length}, staff-skipped ${skippedByStaff}, failed ${failed.length}.`,
    metadata:   { kind: "sms_reminders", target_date: reminderDateStr, sent, skippedByStaff, failed },
    created_by: "cron",
  });

  // 7. Internal warning text — one day before the customer reminder goes out,
  // tell staff who's about to be notified. Dedup by date via timeline_events
  // so reruns the same day don't spam the alert numbers (system_flags is a
  // different, admin-alerts table — not a generic key/value store).
  let warningSent = false;
  const warningDateStr = warningStart.toISOString().slice(0, 10);
  const alertPhones = getAlertPhoneNumbers();

  if (warningItems.length > 0 && alertPhones.length > 0) {
    const { data: existingWarning } = await supabase
      .from("timeline_events")
      .select("id")
      .eq("event_type", "cron_log")
      .eq("metadata->>kind", "sms_warning")
      .eq("metadata->>target_date", warningDateStr)
      .maybeSingle();

    if (!existingWarning) {
      const uniqueNames = [...new Set(warningItems.map(w => w.contactName || w.contactPhone))];
      const dateLabel = formatEventDate(warningItems[0].eventDate);
      const skipInstructions = uniqueNames.map(n => `"No ${n}"`).join(" or ");
      const message = `NorthWake Marine: Tomorrow we'll be texting ${uniqueNames.join(", ")} for work scheduled on ${dateLabel}. Reply ${skipInstructions} to skip that customer's text.`;

      // Persist who's pending so a "No <Name>" reply (handled in the Quo
      // webhook) can be matched back to the right occurrence tomorrow.
      await supabase.from("reminder_pending").upsert(
        warningItems.map(w => ({
          contact_id: w.contactId,
          gcal_event_id: w.eventId,
          contact_name: w.contactName || w.contactPhone,
          target_date: w.eventDate.includes("T") ? w.eventDate.split("T")[0] : w.eventDate,
          skipped: false,
        })),
        { onConflict: "gcal_event_id" }
      );

      try {
        // Send as one group message (all alert numbers in a single call) so
        // it's a shared thread, not separate 1:1 texts.
        await sendSMS(alertPhones, message);
      } catch (err) {
        failed.push(`alert group: ${err instanceof Error ? err.message : String(err)}`);
      }
      warningSent = true;

      await supabase.from("timeline_events").insert({
        contact_id: null,
        event_type: "cron_log",
        title:      "SMS internal warning sent",
        body:       message,
        metadata:   { kind: "sms_warning", target_date: warningDateStr, contacts: uniqueNames, sent_to: alertPhones },
        created_by: "cron",
      });
    }
  }

  return NextResponse.json({
    sent,
    skipped: reminderItems.length - toSend.length,
    failed,
    target_date: reminderDateStr,
    warning_sent: warningSent,
    warning_date: warningDateStr,
  });
}
