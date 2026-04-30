"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import type { PipelineCard as PipelineCardType } from "@/types/pipeline";

function AssetIcon({ type }: { type: PipelineCardType["assetType"] }) {
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

function HeatDot({ heat, lastContactAt }: { heat: PipelineCardType["heat"]; lastContactAt: string | null }) {
  if (!heat) return null;
  const hours = lastContactAt
    ? Math.floor((Date.now() - new Date(lastContactAt).getTime()) / 3_600_000)
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

export default function PipelineCard({ card }: { card: PipelineCardType }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleClick() {
    if (card.contactId) router.push(`/pro/contacts/${card.contactId}`);
    else if (card.leadId) router.push(`/pro/leads/${card.leadId}`);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`bg-white rounded-xl shadow-sm px-4 py-3.5 flex flex-col gap-2 cursor-grab active:cursor-grabbing select-none transition-opacity ${
        isDragging ? "opacity-40" : "opacity-100"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <AssetIcon type={card.assetType} />
        <span className="flex-1 text-slate-800 text-sm font-semibold leading-snug truncate">
          {card.name}
        </span>
        <HeatDot heat={card.heat} lastContactAt={card.lastContactAt} />
      </div>

      {(card.vesselName || card.isReturningClient) && (
        <div className="flex items-center justify-between gap-2 pl-9">
          {card.vesselName && (
            <span className="text-slate-400 text-xs truncate">{card.vesselName}</span>
          )}
          {card.isReturningClient && (
            <span className="bg-[#000080]/10 text-[#000080] text-[9px] tracking-widest uppercase font-semibold rounded-full px-2 py-0.5 shrink-0 whitespace-nowrap">
              {card.returningReason === "overdue_service" ? "Returning · Overdue" : "Returning"}
            </span>
          )}
        </div>
      )}

      {card.sourceType === "lead" && (
        <div className="pl-9">
          <span className="text-slate-300 text-[9px] tracking-widest uppercase">New lead</span>
        </div>
      )}
    </div>
  );
}
