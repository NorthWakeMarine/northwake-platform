import { createClient } from "@supabase/supabase-js";
import type { PipelineCard, PipelineStage, HeatLevel, HealthFlag } from "@/types/pipeline";
import { normalizePhone } from "@/lib/phone";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

function computeStageHeat(stage: PipelineStage, stageEnteredAt: string | null): HeatLevel {
  if (stage === "work_scheduled" || stage === "paid") return "green";
  if (stage === "lost") return "red";
  if (!stageEnteredAt) return "green";
  const diffHours = (Date.now() - new Date(stageEnteredAt).getTime()) / 3_600_000;
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

  const [contactsRes, leadsRes, allContactsRes] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, name, email, phone, status, pipeline_stage, last_contact_at, stage_entered_at, created_at, contact_type, health_flags, vessels ( id, name, make_model, year, length_ft, asset_type, last_service_date, service_interval_days )")
      .eq("contact_type", "customer")
      .not("pipeline_stage", "is", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id, name, email, phone, vessel_type, created_at")
      .or("status.is.null,status.neq.converted")
      .order("created_at", { ascending: false }),
    supabase
      .from("contacts")
      .select("email, phone"),
  ]);

  const openLeadEmails = new Set((leadsRes.data ?? []).map((l: { email: string | null }) => l.email).filter(Boolean));

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
      name: c.name ?? c.phone ?? c.email ?? null,
      stage: (c.pipeline_stage ?? "new_leads") as PipelineStage,
      assetType: mapAssetType(vessel?.asset_type ?? null),
      heat: computeStageHeat((c.pipeline_stage ?? "new_leads") as PipelineStage, c.stage_entered_at ?? c.created_at),
      lastContactAt: c.last_contact_at ?? null,
      stageEnteredAt: c.stage_entered_at ?? c.created_at ?? null,
      isReturningClient: isReturning,
      returningReason,
      vesselName: [vessel?.year, vessel?.make_model, vessel?.length_ft ? `${(vessel.length_ft as string).replace(/\s*ft\s*$/i, "")}ft` : null].filter(Boolean).join(" - ") || null,
      email: c.email ?? null,
      phone: c.phone ?? null,
      healthFlags: Array.isArray(c.health_flags) ? (c.health_flags as HealthFlag[]) : [],
    };
  });

  // Deduplicate: skip lead-only cards for anyone already in contacts (any type), matched by email or phone
  const allContacts = allContactsRes.data ?? [];
  const contactEmails = new Set(allContacts.map((c) => c.email).filter(Boolean));
  // Normalize phones on both sides so a known caller whose contact phone is
  // stored in a non-E.164 format still dedupes against the lead Quo created.
  const contactPhones = new Set(allContacts.map((c) => normalizePhone(c.phone)).filter(Boolean));

  const leadCards: PipelineCard[] = (leadsRes.data ?? [])
    .filter((l) => !contactEmails.has(l.email) && !contactPhones.has(normalizePhone(l.phone)))
    .map((l) => ({
      id: `lead_${l.id}`,
      sourceType: "lead" as const,
      contactId: null,
      leadId: l.id,
      name: l.name ?? l.phone ?? l.email ?? null,
      stage: "new_leads" as PipelineStage,
      assetType: mapAssetType(l.vessel_type),
      heat: "green" as HeatLevel,
      lastContactAt: null,
      stageEnteredAt: l.created_at ?? null,
      isReturningClient: false,
      returningReason: null,
      vesselName: null,
      email: l.email ?? null,
      phone: l.phone ?? null,
      healthFlags: [],
    }));

  return [...contactCards, ...leadCards];
}
