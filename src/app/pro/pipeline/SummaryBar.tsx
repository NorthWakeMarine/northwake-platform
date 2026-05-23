"use client";

import type { PipelineCard, PipelineStage } from "@/types/pipeline";
import { STAGE_LABELS, STAGES } from "@/types/pipeline";

export default function SummaryBar({
  columns,
  newLeadsWeek,
  callsWeek,
  totalContacts,
  convertedMonth,
}: {
  columns: Record<PipelineStage, PipelineCard[]>;
  newLeadsWeek: number;
  callsWeek: number;
  totalContacts: number;
  convertedMonth: number;
}) {
  const totalRed = STAGES.flatMap((s) => columns[s]).filter((c) => c.heat === "red").length;
  const totalOverdue = STAGES.flatMap((s) => columns[s]).filter((c) => c.returningReason === "overdue_service").length;

  return (
    <div className="bg-[#F1F2F5] border-b border-[#dcdee3] px-6 py-2.5 flex items-center gap-5 overflow-x-auto shrink-0">
      {STAGES.map((stage) => (
        <div key={stage} className="flex items-center gap-1.5 shrink-0">
          <span className="text-[#1E2938] text-sm font-bold tabular-nums">{columns[stage].length}</span>
          <span className="text-[#1E2938]/45 text-xs">{STAGE_LABELS[stage]}</span>
        </div>
      ))}

      <div className="w-px h-4 bg-[#dcdee3] shrink-0" />
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[#1E2938] text-sm font-bold tabular-nums">{totalContacts}</span>
        <span className="text-[#1E2938]/45 text-xs">total clients</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[#1E2938] text-sm font-bold tabular-nums">{convertedMonth}</span>
        <span className="text-[#1E2938]/45 text-xs">converted (30d)</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[#1E2938] text-sm font-bold tabular-nums">{newLeadsWeek}</span>
        <span className="text-[#1E2938]/45 text-xs">new leads (7d)</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[#1E2938] text-sm font-bold tabular-nums">{callsWeek}</span>
        <span className="text-[#1E2938]/45 text-xs">calls (7d)</span>
      </div>

      <div className="ml-auto flex items-center gap-4 shrink-0">
        {totalRed > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
            <span className="text-red-600 text-xs font-medium">{totalRed} need review</span>
          </div>
        )}
        {totalOverdue > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span className="text-amber-600 text-xs font-medium">{totalOverdue} overdue service</span>
          </div>
        )}
      </div>
    </div>
  );
}
