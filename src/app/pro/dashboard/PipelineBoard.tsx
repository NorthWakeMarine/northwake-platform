"use client";

import { useState, useTransition, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { PipelineCard, PipelineStage } from "@/types/pipeline";
import { STAGES } from "@/types/pipeline";
import { updatePipelineStage } from "@/app/actions";
import PipelineColumn from "./PipelineColumn";
import PipelineCardComponent from "./PipelineCard";
import SummaryBar from "./SummaryBar";
import ScheduleModal from "@/components/ScheduleModal";
import InvoiceDraftModal from "./InvoiceDraftModal";

function groupByStage(cards: PipelineCard[]): Record<PipelineStage, PipelineCard[]> {
  const result = Object.fromEntries(STAGES.map((s) => [s, [] as PipelineCard[]])) as Record<PipelineStage, PipelineCard[]>;
  for (const card of cards) {
    result[card.stage].push(card);
  }
  return result;
}

export default function PipelineBoard({ initialCards }: { initialCards: PipelineCard[] }) {
  const [columns, setColumns] = useState<Record<PipelineStage, PipelineCard[]>>(() =>
    groupByStage(initialCards)
  );
  const [activeCard, setActiveCard] = useState<PipelineCard | null>(null);
  const [schedulingCard, setSchedulingCard] = useState<{
    contactId: string;
    contactName: string;
    vesselName: string | null;
  } | null>(null);
  const [invoiceCard, setInvoiceCard] = useState<PipelineCard | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const card = event.active.data.current?.card as PipelineCard | undefined;
    if (card) setActiveCard(card);
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCard(null);
      const { active, over } = event;
      if (!over) return;

      const targetStage = over.id as PipelineStage;
      if (!STAGES.includes(targetStage)) return;

      const card = active.data.current?.card as PipelineCard;
      if (!card || card.stage === targetStage) return;

      const prevColumns = columns;

      setColumns((prev) => {
        const next = { ...prev };
        next[card.stage] = prev[card.stage].filter((c) => c.id !== card.id);
        const updated = { ...card, stage: targetStage };
        next[targetStage] = [updated, ...prev[targetStage]];
        return next;
      });

      startTransition(async () => {
        const sourceId = card.sourceType === "lead" ? card.leadId! : card.contactId!;
        const result = await updatePipelineStage(sourceId, card.sourceType, targetStage);

        if (!result.ok) {
          setColumns(prevColumns);
          return;
        }

        if (result.contactId && card.sourceType === "lead") {
          setColumns((prev) => {
            const next = { ...prev };
            next[targetStage] = prev[targetStage].map((c) =>
              c.id === card.id
                ? { ...c, id: result.contactId!, sourceType: "contact", contactId: result.contactId!, leadId: null, vesselName: result.vesselName ?? c.vesselName }
                : c
            );
            return next;
          });
        }

        if (targetStage === "work_scheduled" && result.contactId) {
          setSchedulingCard({
            contactId: result.contactId,
            contactName: result.contactName ?? card.name,
            vesselName: result.vesselName ?? card.vesselName,
          });
        }

        if (targetStage === "done_invoiced" && result.contactId) {
          const updatedCard: PipelineCard = {
            ...card,
            id: result.contactId,
            sourceType: "contact",
            contactId: result.contactId,
            stage: "done_invoiced",
          };
          setInvoiceCard(updatedCard);
        }
      });
    },
    [columns]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-slate-900 text-xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-slate-400 text-xs mt-0.5">Drag leads through your service workflow.</p>
        </div>
      </div>

      <SummaryBar columns={columns} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 px-6 py-5 items-start min-w-max">
            {STAGES.map((stage) => (
              <PipelineColumn key={stage} stage={stage} cards={columns[stage]} />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="shadow-xl ring-1 ring-[#000080]/20 rounded-xl rotate-1 opacity-95">
              <PipelineCardComponent card={activeCard} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {schedulingCard && (
        <ScheduleModal
          card={schedulingCard}
          onClose={() => setSchedulingCard(null)}
        />
      )}

      {invoiceCard && (
        <InvoiceDraftModal
          card={invoiceCard}
          onClose={() => setInvoiceCard(null)}
        />
      )}
    </div>
  );
}
