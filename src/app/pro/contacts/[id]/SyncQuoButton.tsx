"use client";

import { useState, useTransition } from "react";
import { syncQuoForContact } from "@/app/actions";

export default function SyncQuoButton({ contactId }: { contactId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; imported?: number; error?: string } | null>(null);

  function handleSync() {
    startTransition(async () => {
      const res = await syncQuoForContact(contactId);
      setResult(res);
    });
  }

  if (result?.ok) {
    return (
      <span className="text-[10px] tracking-widest uppercase font-medium text-emerald-600 px-4 py-2">
        {result.imported === 0 ? "Up to date" : `${result.imported} imported`}
      </span>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={isPending}
      className="border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm font-medium transition-colors disabled:opacity-50"
    >
      {isPending ? "Syncing..." : result?.error ? "Retry Quo" : "Sync Quo"}
    </button>
  );
}
