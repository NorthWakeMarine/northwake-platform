export type PipelineStage =
  | "new_leads"
  | "discovery"
  | "estimate_sent"
  | "needs_attention"
  | "work_scheduled"
  | "done_invoiced"
  | "paid"
  | "lost";

export const STAGE_LABELS: Record<PipelineStage, string> = {
  new_leads:       "New Leads",
  discovery:       "Discovery",
  estimate_sent:   "Estimate Sent",
  needs_attention: "Needs Attention",
  work_scheduled:  "Work Scheduled",
  done_invoiced:   "Done / Invoiced",
  paid:            "Paid",
  lost:            "Lost",
};

export const STAGES: PipelineStage[] = [
  "new_leads",
  "discovery",
  "estimate_sent",
  "work_scheduled",
  "done_invoiced",
  "paid",
  "lost",
];

export type HeatLevel = "red" | "amber" | "green";

export type HealthFlag = {
  type: "missing_qb" | "missing_waiver" | "comms_gap" | "incomplete_profile";
  label: string;
};

export interface PipelineCard {
  id: string;
  sourceType: "contact" | "lead";
  contactId: string | null;
  leadId: string | null;
  name: string | null;
  stage: PipelineStage;
  assetType: "vessel" | "car" | "plane" | "other" | null;
  heat: HeatLevel | null;
  lastContactAt: string | null;
  stageEnteredAt: string | null;
  isReturningClient: boolean;
  returningReason: "new_lead" | "overdue_service" | null;
  vesselName: string | null;
  email: string | null;
  phone: string | null;
  healthFlags: HealthFlag[];
}
