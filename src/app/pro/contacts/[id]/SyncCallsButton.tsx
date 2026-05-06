"use client";

import { useTransition, useState } from "react";
import { syncDialpadCallsForContact } from "@/app/actions";

export default function SyncCallsButton({ contactId }: { contactId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ synced: number; error?: string } | null>(null);

  function handleSync() {
    startTransition(async () => {
      const res = await syncDialpadCallsForContact(contactId);
      setResult({ synced: res.synced, error: res.error });
      if (!res.error) setTimeout(() => setResult(null), 4000);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={isPending}
        className="border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        title="Pull call history from Dialpad"
      >
        <svg
          aria-hidden="true"
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isPending ? "animate-spin" : ""}
        >
          {isPending ? (
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          ) : (
            <>
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-.41-4.49" />
            </>
          )}
        </svg>
        {isPending ? "Syncing…" : "Sync Calls"}
      </button>
      {result && (
        <span className={`text-[10px] font-medium ${result.error ? "text-red-500" : "text-emerald-600"}`}>
          {result.error
            ? result.error
            : result.synced === 0
            ? "Already up to date"
            : `${result.synced} call${result.synced !== 1 ? "s" : ""} added`}
        </span>
      )}
    </div>
  );
}
