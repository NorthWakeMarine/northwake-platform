import { createClient } from "@supabase/supabase-js";
import type { PipelineCard, PipelineStage, HeatLevel } from "@/types/pipeline";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

function computeHeat(lastContactAt: string | null): HeatLevel | null {
  if (!lastContactAt) return "red";
  const diffHours = (Date.now() - new Date(lastContactAt).getTime()) / 3_600_000;
  if (diffHours > 48) return "red";
  if (diffHours > 24) return "amber";
  return "green";
}

function mapAssetType(raw: string | null): PipelineCard["assetType"] {
  if (raw === "car" || raw === "plane" || raw === "other") return raw;
  if (raw) return "vessel";
  return null;
}

export async function getPipelineBoard(): Promise<PipelineCard[]> {
  const supabase = svc();

  const [contactsRes, leadsRes, openLeadsRes] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, name, email, phone, status, pipeline_stage, last_contact_at, created_at, vessels ( id, name, asset_type, last_service_date, service_interval_days )")
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id, name, email, phone, vessel_type, created_at")
      .or("status.is.null,status.neq.converted")
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("email")
      .or("status.is.null,status.neq.converted"),
  ]);

  const openLeadEmails = new Set((openLeadsRes.data ?? []).map((l: { email: string }) => l.email).filter(Boolean));

  const now = Date.now();
  const contactCards: PipelineCard[] = (contactsRes.data ?? []).map((c) => {
    const vessel = Array.isArray(c.vessels) ? c.vessels[0] : c.vessels;
    const hasOpenLead = openLeadEmails.has(c.email);

    const overdueVessel =
      vessel?.last_service_date && vessel?.service_interval_days
        ? Math.floor(
            (now - new Date(vessel.last_service_date).getTime()) / 86_400_000
          ) > vessel.service_interval_days
        : false;

    const isReturning = c.status === "client" && (hasOpenLead || overdueVessel);
    const returningReason = isReturning
      ? hasOpenLead
        ? ("new_lead" as const)
        : ("overdue_service" as const)
      : null;

    return {
      id: c.id,
      sourceType: "contact" as const,
      contactId: c.id,
      leadId: null,
      name: c.name ?? c.email ?? "Unknown",
      stage: (c.pipeline_stage ?? "new_leads") as PipelineStage,
      assetType: mapAssetType(vessel?.asset_type ?? null),
      heat: computeHeat(c.last_contact_at),
      lastContactAt: c.last_contact_at ?? null,
      isReturningClient: isReturning,
      returningReason,
      vesselName: vessel?.name ?? null,
      email: c.email ?? null,
      phone: c.phone ?? null,
    };
  });

  // Deduplicate: skip lead-only cards whose email already has a contact card
  const contactEmails = new Set(contactsRes.data?.map((c) => c.email).filter(Boolean));

  const leadCards: PipelineCard[] = (leadsRes.data ?? [])
    .filter((l) => !contactEmails.has(l.email))
    .map((l) => ({
      id: `lead_${l.id}`,
      sourceType: "lead" as const,
      contactId: null,
      leadId: l.id,
      name: l.name ?? l.email ?? "Unknown",
      stage: "new_leads" as PipelineStage,
      assetType: mapAssetType(l.vessel_type),
      heat: "red" as HeatLevel,
      lastContactAt: null,
      isReturningClient: false,
      returningReason: null,
      vesselName: null,
      email: l.email ?? null,
      phone: l.phone ?? null,
    }));

  return [...contactCards, ...leadCards];
}
