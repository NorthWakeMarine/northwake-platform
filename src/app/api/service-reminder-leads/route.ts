import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parsePhoneNumberFromString } from "libphonenumber-js";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const parsed = parsePhoneNumberFromString(raw, "US");
  return parsed?.isValid() ? parsed.format("E.164") : raw.trim() || null;
}

// Run every Monday at 9 AM — checks all vessel services for overdue intervals.
// New contacts (no pipeline_stage) get a service_reminder lead created.
// Returning clients sitting in a closed-out stage (done_invoiced/paid/lost)
// get moved back to Discovery instead, once per overdue cycle.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = svc();

  // Fetch all vessel services with their vessel and owner contact
  const { data: services, error: svcErr } = await supabase
    .from("vessel_services")
    .select(`
      id, service_name, interval_days, last_service_date,
      vessels!vessel_id (
        id, name, make_model, year, length_ft,
        contacts!owner_id ( id, name, phone, status, pipeline_stage )
      )
    `);

  if (svcErr) {
    console.error("[service-reminder-leads] fetch error", svcErr);
    return NextResponse.json({ error: svcErr.message }, { status: 500 });
  }

  // Stages a returning client can be reactivated out of. Contacts still active
  // in the pipeline (new_leads..work_scheduled) are left alone.
  const TERMINAL_STAGES = new Set(["done_invoiced", "paid", "lost"]);

  const now = Date.now();
  let created = 0;
  let reactivated = 0;
  let skipped = 0;

  for (const svc of services ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vessel  = (svc as any).vessels as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contact = vessel?.contacts as any;

    if (!svc.interval_days || !svc.last_service_date || !contact?.phone) {
      skipped++;
      continue;
    }

    const lastMs  = new Date(svc.last_service_date).getTime();
    const daysAgo = Math.floor((now - lastMs) / 86_400_000);

    if (daysAgo < svc.interval_days) {
      skipped++;
      continue;
    }

    const phone = normalizePhone(contact.phone);
    if (!phone) { skipped++; continue; }

    // Returning client sitting in a closed-out stage — pull them back into
    // Discovery so the overdue service gets worked, once per overdue cycle.
    if (contact.pipeline_stage) {
      if (!TERMINAL_STAGES.has(contact.pipeline_stage)) { skipped++; continue; }

      const { data: lastReactivation } = await supabase
        .from("timeline_events")
        .select("metadata")
        .eq("contact_id", contact.id)
        .eq("event_type", "service_overdue_reactivation")
        .eq("metadata->>vessel_service_id", svc.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const alreadyHandled =
        (lastReactivation?.metadata as { last_service_date?: string } | null)?.last_service_date === svc.last_service_date;
      if (alreadyHandled) { skipped++; continue; }

      await supabase.from("contacts").update({
        pipeline_stage: "discovery",
        stage_entered_at: new Date().toISOString(),
      }).eq("id", contact.id);

      await supabase.from("timeline_events").insert({
        contact_id: contact.id,
        event_type: "service_overdue_reactivation",
        title: `${svc.service_name} overdue — moved to Discovery`,
        body: `${vessel.name ?? "Vessel"} is overdue for ${svc.service_name}. Contact moved back to Discovery for follow-up.`,
        metadata: { vessel_service_id: svc.id, last_service_date: svc.last_service_date },
        created_by: "cron",
      });

      reactivated++;
      continue;
    }

    const vesselLabel = [vessel.year, vessel.make_model, vessel.length_ft ? `${String(vessel.length_ft).replace(/\s*ft\s*$/i, "")}ft` : null]
      .filter(Boolean).join(" ") || vessel.name || "Vessel";

    const serviceName = svc.service_name ?? "Service";
    const months = Math.floor(daysAgo / 30);
    const timeLabel = months >= 1 ? `${months} month${months !== 1 ? "s" : ""}` : `${daysAgo} days`;

    const { ingestContact } = await import("@/lib/ingest");
    await ingestContact({
      name: contact.name ?? undefined,
      phone,
      vessel_type: vessel.make_model ?? undefined,
      vessel_length: vessel.length_ft ? String(vessel.length_ft).replace(/\s*ft\s*$/i, "") : undefined,
      source: "service_reminder",
      event_type: "service_reminder",
      event_title: `${serviceName} overdue`,
      event_body: `Last ${serviceName} was ${timeLabel} ago on ${vesselLabel}. Due for service, reach out to schedule.`,
      metadata: { service: serviceName },
    });

    created++;
  }

  return NextResponse.json({ ok: true, created, reactivated, skipped });
}
