"use client";

import { useState, useTransition } from "react";
import { syncContactToQuickBooks } from "@/app/actions";

export default function SyncToQbButton({ contactId }: { contactId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  function handle() {
    startTransition(async () => {
      const res = await syncContactToQuickBooks(contactId);
      setResult(res);
    });
  }

  if (result?.ok) {
    return (
      <span className="text-emerald-600 text-[10px] tracking-widest uppercase font-medium">
        Synced to QB
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handle}
        disabled={isPending}
        className="border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm font-medium transition-colors disabled:opacity-50"
      >
        {isPending ? "Syncing..." : "Sync to QB"}
      </button>
      {result?.error && (
        <p className="text-red-500 text-[10px]">{result.error}</p>
      )}
    </div>
  );
}
