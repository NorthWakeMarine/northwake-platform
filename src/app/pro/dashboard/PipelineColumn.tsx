"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { PipelineCard, PipelineStage } from "@/types/pipeline";
import { STAGE_LABELS } from "@/types/pipeline";
import PipelineCardComponent from "./PipelineCard";

const ACCENT: Record<PipelineStage, string> = {
  new_leads:      "border-l-2 border-emerald-400",
  discovery:      "border-l-2 border-blue-400",
  estimate_sent:  "border-l-2 border-amber-400",
  work_scheduled: "border-l-2 border-[#000080]",
  done_invoiced:  "border-l-2 border-slate-300",
};

export default function PipelineColumn({
  stage,
  cards,
}: {
  stage: PipelineStage;
  cards: PipelineCard[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const cardIds = cards.map((c) => c.id);

  return (
    <div className="w-60 shrink-0 flex flex-col gap-2">
      <div className={`flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 ${ACCENT[stage]}`}>
        <span className="text-slate-500 text-[11px] font-semibold tracking-widest uppercase">
          {STAGE_LABELS[stage]}
        </span>
        <span className="bg-slate-200 text-slate-500 text-xs font-semibold rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
          {cards.length}
        </span>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-2 min-h-[120px] rounded-xl p-2 transition-colors ${
            isOver ? "bg-slate-100/80" : "bg-slate-50/60"
          }`}
        >
          {cards.map((card) => (
            <PipelineCardComponent key={card.id} card={card} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
