import { createClient } from "@supabase/supabase-js";
import type { PipelineCard, PipelineStage, HeatLevel, HealthFlag } from "@/types/pipeline";

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

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, email, phone, status, pipeline_stage, last_contact_at, stage_entered_at, created_at, contact_type, health_flags, vessels ( id, name, make_model, year, length_ft, asset_type, last_service_date, service_interval_days )")
    .eq("contact_type", "customer")
    .not("pipeline_stage", "is", null)
    .order("created_at", { ascending: false });

  const now = Date.now();
  return (contacts ?? []).map((c) => {
    const vessel = Array.isArray(c.vessels) ? c.vessels[0] : c.vessels;

    const overdueVessel =
      vessel?.last_service_date && vessel?.service_interval_days
        ? Math.floor(
            (now - new Date(vessel.last_service_date).getTime()) / 86_400_000
          ) > vessel.service_interval_days
        : false;

    const isReturning = c.status === "client" && overdueVessel;
    const returningReason = isReturning ? ("overdue_service" as const) : null;

    return {
      id: c.id,
      contactId: c.id,
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
}
