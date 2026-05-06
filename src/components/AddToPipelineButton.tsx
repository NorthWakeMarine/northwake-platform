"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updatePipelineStage } from "@/app/actions";
import { STAGE_LABELS, type PipelineStage } from "@/types/pipeline";

interface Props {
  id: string;
  sourceType: "contact" | "lead";
  currentStage?: PipelineStage | null;
}

const STAGE_ORDER: PipelineStage[] = [
  "new_leads", "discovery", "estimate_sent",
  "needs_attention", "work_scheduled", "done_invoiced",
];

export default function AddToPipelineButton({ id, sourceType, currentStage }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  if (currentStage) {
    return (
      <span className="text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-sm font-semibold bg-[#000080]/10 text-[#000080] border border-[#000080]/20">
        Pipeline: {STAGE_LABELS[currentStage]}
      </span>
    );
  }

  function addToStage(stage: PipelineStage) {
    setOpen(false);
    startTransition(async () => {
      const res = await updatePipelineStage(id, sourceType, stage);
      if (!res.ok) { setError(res.error ?? "Failed."); return; }
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="border border-[#000080]/30 text-[#000080] hover:bg-[#000080]/5 text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        {isPending ? "Adding..." : (
          <>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add to Pipeline
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-sm shadow-lg z-20 min-w-[180px]">
          {STAGE_ORDER.map((stage) => (
            <button
              key={stage}
              onClick={() => addToStage(stage)}
              className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors first:rounded-t-sm last:rounded-b-sm"
            >
              {STAGE_LABELS[stage]}
            </button>
          ))}
        </div>
      )}

      {error && <p className="absolute top-full mt-1 text-red-500 text-[10px] whitespace-nowrap">{error}</p>}
    </div>
  );
}
