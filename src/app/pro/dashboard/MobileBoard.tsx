"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PipelineCard, PipelineStage } from "@/types/pipeline";
import { STAGES, STAGE_LABELS } from "@/types/pipeline";
import { removeFromPipeline, deleteLead } from "@/app/actions";

function AssetIcon({ type }: { type: PipelineCard["assetType"] }) {
  return (
    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-[#000080]">
      {type === "car" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2" />
          <circle cx="9" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
        </svg>
      ) : type === "plane" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4c-1 0-1.5.5-2.5 1.5L13 9 4.8 6.2c-.5-.1-1 .1-1.3.5l-.2.3 4 3.8-1.2 1.5-2.5-.4-.2.2 2.5 2.5 2.5 2.5.2-.2-.4-2.5 1.5-1.2 3.8 4 .3-.2c.4-.3.6-.8.5-1.3z"/>
        </svg>
      ) : type === "other" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l2-7 4-2 6 0 4 2 2 7H3z"/>
          <path d="M3 17v2h18v-2"/>
          <path d="M8 17v-3"/><path d="M16 17v-3"/>
        </svg>
      )}
    </div>
  );
}

function HeatDot({ heat, lastContactAt }: { heat: PipelineCard["heat"]; lastContactAt: string | null }) {
  if (!heat) return null;
  const hours = lastContactAt
    ? Math.floor((new Date().getTime() - new Date(lastContactAt).getTime()) / 3_600_000)
    : null;
  const title = hours !== null ? `Last contact ${hours}h ago` : "No contact recorded";
  return (
    <span
      title={title}
      className={`w-2 h-2 rounded-full shrink-0 ${
        heat === "red"
          ? "bg-red-500 animate-pulse"
          : heat === "amber"
          ? "bg-amber-400"
          : "bg-emerald-400"
      }`}
    />
  );
}

function HealthWarningIcon({ flags }: { flags: PipelineCard["healthFlags"] }) {
  if (!flags || flags.length === 0) return null;
  const tip = flags.map((f) => f.label).join(", ");
  return (
    <span title={tip} className="shrink-0">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </span>
  );
}

function MoveDropdown({
  currentStage,
  onSelect,
  onClose,
}: {
  currentStage: PipelineStage;
  onSelect: (stage: PipelineStage) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const otherStages = STAGES.filter((s) => s !== currentStage);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-sm shadow-lg z-20 min-w-[160px]"
    >
      {otherStages.map((stage) => (
        <button
          key={stage}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(stage);
          }}
          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 first:rounded-t-sm last:rounded-b-sm"
        >
          {STAGE_LABELS[stage]}
        </button>
      ))}
    </div>
  );
}

function MobileCard({
  card,
  onRemove,
  onMove,
}: {
  card: PipelineCard;
  onRemove: () => void;
  onMove: (stage: PipelineStage) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [moveOpen, setMoveOpen] = useState(false);

  function handleCardClick() {
    if (card.contactId) router.push(`/pro/contacts/${card.contactId}`);
    else if (card.leadId) router.push(`/pro/leads/${card.leadId}`);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      if (card.sourceType === "lead" && card.leadId) {
        await deleteLead(card.leadId);
      } else if (card.contactId) {
        await removeFromPipeline(card.contactId);
      }
      onRemove();
    });
  }

  function handleMoveSelect(stage: PipelineStage) {
    setMoveOpen(false);
    onMove(stage);
  }

  const accentClass = card.stage === "needs_attention" ? "border-l-4 border-red-400" : "";

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-xl shadow-sm px-4 py-3.5 mb-2 cursor-pointer select-none transition-opacity ${
        isPending ? "opacity-40" : "opacity-100"
      } ${accentClass}`}
    >
      <div className="flex items-center gap-2.5">
        <AssetIcon type={card.assetType} />
        <span className="flex-1 text-slate-800 text-sm font-semibold leading-snug truncate">
          {card.name}
        </span>
        <HealthWarningIcon flags={card.healthFlags} />
        <HeatDot heat={card.heat} lastContactAt={card.lastContactAt} />

        <div className="relative flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMoveOpen((v) => !v);
            }}
            className="text-slate-300 hover:text-[#000080] transition-colors"
            title="Move to stage"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {moveOpen && (
            <MoveDropdown
              currentStage={card.stage}
              onSelect={handleMoveSelect}
              onClose={() => setMoveOpen(false)}
            />
          )}

          {(card.contactId || (card.sourceType === "lead" && card.leadId)) && (
            <button
              onClick={handleRemove}
              disabled={isPending}
              className="text-slate-300 hover:text-red-400 text-xs leading-none transition-colors"
              title={card.sourceType === "lead" ? "Dismiss lead" : "Remove from pipeline"}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {(card.vesselName || card.isReturningClient) && (
        <div className="flex items-center justify-between gap-2 pl-9 mt-1">
          {card.vesselName && (
            <span className="text-slate-400 text-xs truncate">{card.vesselName}</span>
          )}
          {card.isReturningClient && (
            <span className="bg-[#000080]/10 text-[#000080] text-[9px] tracking-widest uppercase font-semibold rounded-full px-2 py-0.5 shrink-0 whitespace-nowrap">
              {card.returningReason === "overdue_service" ? "Returning / Overdue" : "Returning"}
            </span>
          )}
        </div>
      )}

      {card.sourceType === "lead" && (
        <div className="pl-9 mt-1">
          <span className="text-slate-300 text-[9px] tracking-widest uppercase">New Lead</span>
        </div>
      )}
    </div>
  );
}

interface MobileBoardProps {
  columns: Record<PipelineStage, PipelineCard[]>;
  onMoveCard: (cardId: string, card: PipelineCard, newStage: PipelineStage) => void;
  onRemoveCard: (stage: PipelineStage, cardId: string) => void;
  className?: string;
}

export default function MobileBoard({ columns, onMoveCard, onRemoveCard, className }: MobileBoardProps) {
  const [activeStage, setActiveStage] = useState<PipelineStage>(STAGES[0]);

  const cards = columns[activeStage] ?? [];

  return (
    <div className={className}>
      <div className="bg-white border-b border-slate-200 overflow-x-auto shrink-0">
        <div className="flex min-w-max">
          {STAGES.map((stage) => {
            const isActive = stage === activeStage;
            const count = columns[stage]?.length ?? 0;
            const isAttention = stage === "needs_attention";

            let tabTextClass: string;
            if (isActive) {
              tabTextClass = isAttention ? "text-red-500" : "text-[#000080]";
            } else {
              tabTextClass = isAttention ? "text-red-400" : "text-slate-400";
            }

            return (
              <button
                key={stage}
                onClick={() => setActiveStage(stage)}
                className={`relative px-4 py-3 text-[11px] tracking-widest uppercase font-semibold whitespace-nowrap transition-colors ${tabTextClass} ${
                  isActive ? "border-b-2 border-[#000080]" : ""
                }`}
              >
                {STAGE_LABELS[stage]}
                {count > 0 && (
                  <span
                    className={`ml-1.5 text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
                      isActive
                        ? "bg-[#000080]/10 text-[#000080]"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {cards.length === 0 ? (
          <div className="flex items-center justify-center pt-16 text-slate-400 text-sm">
            No cards in this stage
          </div>
        ) : (
          cards.map((card) => (
            <MobileCard
              key={card.id}
              card={card}
              onRemove={() => onRemoveCard(activeStage, card.id)}
              onMove={(newStage) => onMoveCard(card.id, card, newStage)}
            />
          ))
        )}
      </div>
    </div>
  );
}
