export type PipelineStage =
  | "new_leads"
  | "discovery"
  | "estimate_sent"
  | "work_scheduled"
  | "done_invoiced";

export const STAGE_LABELS: Record<PipelineStage, string> = {
  new_leads:      "New Leads",
  discovery:      "Discovery",
  estimate_sent:  "Estimate Sent",
  work_scheduled: "Work Scheduled",
  done_invoiced:  "Done / Invoiced",
};

export const STAGES: PipelineStage[] = [
  "new_leads",
  "discovery",
  "estimate_sent",
  "work_scheduled",
  "done_invoiced",
];

export type HeatLevel = "red" | "amber" | "green";

export interface PipelineCard {
  id: string;
  sourceType: "contact" | "lead";
  contactId: string | null;
  leadId: string | null;
  name: string;
  stage: PipelineStage;
  assetType: "vessel" | "car" | "plane" | "other" | null;
  heat: HeatLevel | null;
  lastContactAt: string | null;
  isReturningClient: boolean;
  returningReason: "new_lead" | "overdue_service" | null;
  vesselName: string | null;
  email: string | null;
  phone: string | null;
}
