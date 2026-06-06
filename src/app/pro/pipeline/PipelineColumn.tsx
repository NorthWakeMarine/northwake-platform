"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { PipelineCard, PipelineStage } from "@/types/pipeline";
import { STAGE_LABELS } from "@/types/pipeline";
import PipelineCardComponent from "./PipelineCard";

const ACCENT: Record<PipelineStage, string> = {
  new_leads:       "border-l-2 border-emerald-400",
  discovery:       "border-l-2 border-blue-400",
  estimate_sent:   "border-l-2 border-amber-400",
  needs_attention: "border-l-2 border-red-400",
  work_scheduled:  "border-l-2 border-[#000080]",
  done_invoiced:   "border-l-2 border-slate-300",
  paid:            "border-l-2 border-emerald-600",
  lost:            "border-l-2 border-rose-400",
};

const PipelineColumn = memo(function PipelineColumn({
  stage,
  cards,
  onRemoveCard,
}: {
  stage: PipelineStage;
  cards: PipelineCard[];
  onRemoveCard?: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const cardIds = cards.map((c) => c.id);

  return (
    <div className="flex-1 min-w-36 flex flex-col gap-1.5 min-h-0">
      <div className={`flex items-center justify-between px-2 py-1.5 rounded-md bg-[#F1F2F5] neu-col ${ACCENT[stage]}`}>
        <span className="text-[#1E2938]/60 text-[11px] font-semibold tracking-widest uppercase">
          {STAGE_LABELS[stage]}
        </span>
        <span className="bg-white/70 text-[#1E2938] text-[10px] font-bold rounded-sm px-2 py-0.5 min-w-[1.5rem] text-center tabular-nums">
          {cards.length}
        </span>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-1.5 flex-1 rounded-md p-2 transition-all ${
            isOver ? "bg-[#eceef1] neu-inset" : "bg-[#eceef1]"
          }`}
        >
          {cards.length === 0 ? (
            <div className="pt-2">
              <p className="text-slate-300 text-[10px] tracking-widest uppercase text-center leading-relaxed">
                Drag cards here
              </p>
            </div>
          ) : (
            cards.map((card) => (
              <PipelineCardComponent key={card.id} card={card} onRemove={onRemoveCard} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
});

export default PipelineColumn;
