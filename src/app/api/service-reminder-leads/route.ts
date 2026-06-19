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

// Run every Monday at 9 AM — checks all vessel services for overdue intervals
// and creates a service_reminder lead if one doesn't already exist.
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
        contacts!owner_id ( id, name, phone )
      )
    `);

  if (svcErr) {
    console.error("[service-reminder-leads] fetch error", svcErr);
    return NextResponse.json({ error: svcErr.message }, { status: 500 });
  }

  const now = Date.now();
  let created = 0;
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

    const vesselLabel = [vessel.year, vessel.make_model, vessel.length_ft ? `${String(vessel.length_ft).replace(/\s*ft\s*$/i, "")}ft` : null]
      .filter(Boolean).join(" ") || vessel.name || "Vessel";

    const serviceName = svc.service_name ?? "Service";
    const months = Math.floor(daysAgo / 30);
    const timeLabel = months >= 1 ? `${months} month${months !== 1 ? "s" : ""}` : `${daysAgo} days`;

    // Skip if an open service_reminder lead already exists for this phone+service
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("phone", phone)
      .eq("source", "service_reminder")
      .eq("service", serviceName)
      .neq("status", "converted")
      .maybeSingle();

    if (existing) { skipped++; continue; }

    await supabase.from("leads").insert({
      name:    contact.name ?? null,
      phone,
      source:  "service_reminder",
      service: serviceName,
      message: `Last ${serviceName} was ${timeLabel} ago on ${vesselLabel}. Due for service — reach out to schedule.`,
      email:   "",
      vessel_type:   vessel.make_model ?? null,
      vessel_length: vessel.length_ft ? String(vessel.length_ft).replace(/\s*ft\s*$/i, "") : null,
    });

    created++;
  }

  return NextResponse.json({ ok: true, created, skipped });
}
