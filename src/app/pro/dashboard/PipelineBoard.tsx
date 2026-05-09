"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
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
import MobileBoard from "./MobileBoard";

function groupByStage(cards: PipelineCard[]): Record<PipelineStage, PipelineCard[]> {
  const result = Object.fromEntries(STAGES.map((s) => [s, [] as PipelineCard[]])) as Record<PipelineStage, PipelineCard[]>;
  for (const card of cards) {
    result[card.stage].push(card);
  }
  return result;
}

export default function PipelineBoard({ initialCards, stats }: { initialCards: PipelineCard[]; stats?: { newLeadsWeek: number; callsWeek: number; totalContacts: number; convertedMonth: number } }) {
  const [columns, setColumns] = useState<Record<PipelineStage, PipelineCard[]>>(() =>
    groupByStage(initialCards)
  );
  const [activeCard, setActiveCard] = useState<PipelineCard | null>(null);
  const [userName, setUserName] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem("pro-user-name")) || ""
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      const meta = (data.user?.user_metadata ?? {}) as Record<string, string>;
      const raw = meta?.full_name || meta?.name || email.split("@")[0] || "";
      const name = raw.charAt(0).toUpperCase() + raw.slice(1);
      setUserName(name);
      localStorage.setItem("pro-user-name", name);
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const card = event.active.data.current?.card as PipelineCard | undefined;
    if (card) setActiveCard(card);
  }

  const moveCard = useCallback(
    (card: PipelineCard, targetStage: PipelineStage) => {
      if (card.stage === targetStage) return;

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
      });
    },
    [columns]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCard(null);
      const { active, over } = event;
      if (!over) return;

      const targetStage = over.id as PipelineStage;
      if (!STAGES.includes(targetStage)) return;

      const card = active.data.current?.card as PipelineCard;
      if (!card) return;

      moveCard(card, targetStage);
    },
    [moveCard]
  );

  const handleMoveCard = useCallback(
    (_cardId: string, card: PipelineCard, newStage: PipelineStage) => {
      moveCard(card, newStage);
    },
    [moveCard]
  );

  const handleRemoveCard = useCallback(
    (stage: PipelineStage, cardId: string) => {
      setColumns((prev) => ({
        ...prev,
        [stage]: prev[stage].filter((c) => c.id !== cardId),
      }));
    },
    []
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-slate-900 text-xl font-bold tracking-tight">
            {userName ? `Welcome back, ${userName}` : "Welcome back"}
          </h1>
          <p className="text-slate-400 text-xs mt-0.5 hidden md:block">Drag leads through your service workflow.</p>
          <p className="text-slate-400 text-xs mt-0.5 md:hidden">Tap a stage to view and move cards.</p>
        </div>
      </div>

      <SummaryBar columns={columns} newLeadsWeek={stats?.newLeadsWeek ?? 0} callsWeek={stats?.callsWeek ?? 0} totalContacts={stats?.totalContacts ?? 0} convertedMonth={stats?.convertedMonth ?? 0} />

      <MobileBoard
        columns={columns}
        onMoveCard={handleMoveCard}
        onRemoveCard={handleRemoveCard}
        className="flex md:hidden flex-1 flex-col min-h-0"
      />

      <div className="hidden md:flex flex-1 flex-col min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-4 px-6 py-5 items-start">
              {STAGES.map((stage) => (
                <PipelineColumn
                  key={stage}
                  stage={stage}
                  cards={columns[stage]}
                  onRemoveCard={(id) => handleRemoveCard(stage, id)}
                />
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
      </div>

    </div>
  );
}
