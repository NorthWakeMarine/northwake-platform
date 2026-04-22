import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { detectCalendarDiscrepancies } from "@/lib/google-calendar";

// Called by a Vercel cron job (vercel.json: "crons":[{"path":"/api/calendar-sync","schedule":"0 * * * *"}])
// or hit manually to reconcile Google Calendar vs CRM.
export async function GET(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.INGEST_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Fetch all timeline events that have google_event_id in metadata
  const { data: events, error } = await supabase
    .from("timeline_events")
    .select("id, contact_id, metadata, title")
    .eq("event_type", "appointment_scheduled")
    .not("metadata->google_event_id", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ checked: 0, flagged: 0 });
  }

  type EventRow = { id: string; contact_id: string; metadata: Record<string, string>; title: string | null };
  const rows = events as EventRow[];
  const googleIds = rows.map((e) => e.metadata?.google_event_id).filter(Boolean);

  const discrepancies = await detectCalendarDiscrepancies(googleIds);

  let flagged = 0;

  for (const disc of discrepancies) {
    const source = rows.find((e) => e.metadata?.google_event_id === disc.googleEventId);
    if (!source) continue;

    // Check if already flagged
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

  return NextResponse.json({ checked: googleIds.length, flagged });
}
