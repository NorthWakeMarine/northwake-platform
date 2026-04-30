"use client";

import type { PipelineCard, PipelineStage } from "@/types/pipeline";
import { STAGE_LABELS, STAGES } from "@/types/pipeline";

export default function SummaryBar({
  columns,
}: {
  columns: Record<PipelineStage, PipelineCard[]>;
}) {
  const totalRed = STAGES.flatMap((s) => columns[s]).filter((c) => c.heat === "red").length;
  const totalOverdue = STAGES.flatMap((s) => columns[s]).filter((c) => c.returningReason === "overdue_service").length;

  return (
    <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-6 overflow-x-auto shrink-0">
      {STAGES.map((stage) => (
        <div key={stage} className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-800 text-sm font-bold">{columns[stage].length}</span>
          <span className="text-slate-400 text-xs">{STAGE_LABELS[stage]}</span>
        </div>
      ))}

      <div className="ml-auto flex items-center gap-4 shrink-0">
        {totalRed > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
            <span className="text-red-600 text-xs font-medium">{totalRed} need contact</span>
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
