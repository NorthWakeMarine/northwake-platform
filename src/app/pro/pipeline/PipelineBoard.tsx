"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
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
import MobileBoard from "./MobileBoard";
import NewPlusModal from "@/components/NewPlusModal";

function groupByStage(cards: PipelineCard[]): Record<PipelineStage, PipelineCard[]> {
  const result = Object.fromEntries(STAGES.map((s) => [s, [] as PipelineCard[]])) as Record<PipelineStage, PipelineCard[]>;
  for (const card of cards) {
    // Stages not in STAGES (e.g. needs_attention) fall into new_leads for display.
    // Remap the card's stage so drag-and-drop operates on the correct bucket key.
    const displayStage: PipelineStage = result[card.stage] !== undefined ? card.stage : "new_leads";
    result[displayStage].push(displayStage !== card.stage ? { ...card, stage: displayStage } : card);
  }
  return result;
}

export default function PipelineBoard({ initialCards }: { initialCards: PipelineCard[] }) {
  const [columns, setColumns] = useState<Record<PipelineStage, PipelineCard[]>>(() =>
    groupByStage(initialCards)
  );
  const [activeCard,   setActiveCard]   = useState<PipelineCard | null>(null);
  const [moveError,    setMoveError]    = useState<string | null>(null);
  const [showNewPlus,  setShowNewPlus]  = useState(false);
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
      const now = new Date().toISOString();
      const newHeat: PipelineCard["heat"] =
        targetStage === "work_scheduled" || targetStage === "paid" ? "green"
        : targetStage === "lost" ? "red"
        : "green";

      const prevColumns = columns;

      setColumns((prev) => {
        const next = { ...prev };
        if (card.stage !== targetStage) {
          next[card.stage] = prev[card.stage].filter((c) => c.id !== card.id);
          const updated = { ...card, stage: targetStage, heat: newHeat, stageEnteredAt: now };
          next[targetStage] = [updated, ...prev[targetStage]];
        } else {
          // Same-column drop: just reset the heat dot without reordering
          next[card.stage] = prev[card.stage].map((c) =>
            c.id === card.id ? { ...c, heat: newHeat, stageEnteredAt: now } : c
          );
        }
        return next;
      });

      startTransition(async () => {
        const sourceId = card.sourceType === "lead" ? card.leadId! : card.contactId!;
        const result = await updatePipelineStage(sourceId, card.sourceType, targetStage);

        if (!result.ok) {
          setColumns(prevColumns);
          setMoveError(result.error ?? "Failed to move card. Please try again.");
          setTimeout(() => setMoveError(null), 4000);
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

      const card = active.data.current?.card as PipelineCard;
      if (!card) return;

      // over.id is either a stage ID (dropped on column) or a card ID (dropped on a card)
      let targetStage = over.id as PipelineStage;
      if (!STAGES.includes(targetStage)) {
        // Find which stage owns the card we hovered over
        const found = STAGES.find((s) =>
          columns[s].some((c) => c.id === over.id)
        );
        if (!found) return;
        targetStage = found;
      }

      moveCard(card, targetStage);
    },
    [moveCard, columns]
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
      {moveError && (
        <div className="shrink-0 bg-red-50 border-b border-red-200 px-6 py-2 text-red-700 text-xs font-medium">
          {moveError}
        </div>
      )}
      <div className="bg-[#eceef1] border-b border-[#dcdee3] px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-[#1E2938] text-xl font-bold tracking-tight">
            {userName ? `Welcome back, ${userName}` : "Welcome back"}
          </h1>
          <p className="text-[#1E2938]/50 text-sm mt-0.5 hidden md:block">Drag leads through your service workflow.</p>
          <p className="text-[#1E2938]/50 text-sm mt-0.5 md:hidden">Tap a stage to view and move cards.</p>
        </div>
        <button
          onClick={() => setShowNewPlus(true)}
          className="flex items-center gap-1.5 bg-[#000080] text-white text-[10px] tracking-widest uppercase font-semibold px-3 py-2 rounded-sm hover:bg-blue-900 transition-colors shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New+
        </button>
      </div>

      {showNewPlus && <NewPlusModal onClose={() => setShowNewPlus(false)} />}

      <MobileBoard
        columns={columns}
        onMoveCard={handleMoveCard}
        onRemoveCard={handleRemoveCard}
        className="flex md:hidden flex-1 flex-col min-h-0"
      />

      <div className="hidden md:flex flex-1 flex-col min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-auto">
            <div className="flex gap-2 px-3 py-4 min-h-full items-stretch">
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
              <div className="shadow-xl ring-1 ring-[#000080]/20 rounded-md rotate-1 opacity-95">
                <PipelineCardComponent card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

    </div>
  );
}
