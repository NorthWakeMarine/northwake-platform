"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTimelineEvent } from "@/app/actions";

export default function DeleteCallButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deleteTimelineEvent(id);
      router.refresh();
    });
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-[10px] tracking-widest uppercase font-semibold text-red-600 hover:text-red-700 disabled:opacity-40 transition-colors"
        >
          {isPending ? "..." : "Delete"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 hover:text-slate-500 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-slate-300 hover:text-red-400 transition-colors p-0.5"
      aria-label="Delete"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    </button>
  );
}
