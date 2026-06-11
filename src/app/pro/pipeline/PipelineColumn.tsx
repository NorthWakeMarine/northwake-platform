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

const EMPTY_COPY: Record<PipelineStage, string> = {
  new_leads:       "Awaiting new leads",
  discovery:       "Nothing in discovery",
  estimate_sent:   "No estimates pending",
  needs_attention: "All clear",
  work_scheduled:  "No jobs scheduled",
  done_invoiced:   "Nothing awaiting payment",
  paid:            "No paid jobs yet",
  lost:            "No lost deals",
};

function EmptyStateGlyph({ stage }: { stage: PipelineStage }) {
  const common = "chrome-text-dark";

  if (stage === "paid") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-6" />
      </svg>
    );
  }
  if (stage === "needs_attention") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 12.5l2 2 4-5" />
      </svg>
    );
  }
  if (stage === "lost") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={common}>
        <circle cx="12" cy="12" r="9" />
        <line x1="8" y1="16" x2="16" y2="8" />
      </svg>
    );
  }
  if (stage === "work_scheduled") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="3" x2="8" y2="7" />
        <line x1="16" y1="3" x2="16" y2="7" />
      </svg>
    );
  }
  if (stage === "estimate_sent") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={common}>
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4z" />
      </svg>
    );
  }
  if (stage === "discovery") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={common}>
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.5" y2="16.5" />
      </svg>
    );
  }
  if (stage === "done_invoiced") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="15" y2="17" />
      </svg>
    );
  }
  // new_leads (default)
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={common}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

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
  const hasCards = cards.length > 0;

  return (
    <div className="flex-1 min-w-36 flex flex-col gap-1.5 min-h-0">
      <div className={`flex items-center justify-between px-2 py-1.5 rounded-md bg-[#F1F2F5] neu-col ${ACCENT[stage]}`}>
        <span className="text-[#1E2938]/60 text-[11px] font-semibold tracking-widest uppercase">
          {STAGE_LABELS[stage]}
        </span>
        <span
          className={`text-[10px] font-bold rounded-sm px-2 py-0.5 min-w-[1.5rem] text-center tabular-nums ${
            hasCards
              ? "bg-white/80 text-[#1E2938]"
              : "bg-white/40 text-[#1E2938]/50"
          }`}
        >
          {cards.length}
        </span>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-1.5 flex-1 rounded-md p-2 transition-all ${
            isOver
              ? "bg-[#eceef1] neu-inset ring-1 ring-[#000080]/15"
              : "bg-[#eceef1]"
          }`}
        >
          {!hasCards ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6 opacity-70">
              <EmptyStateGlyph stage={stage} />
              <p className="text-slate-400 text-[10px] tracking-[0.2em] uppercase text-center leading-relaxed">
                {EMPTY_COPY[stage]}
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
