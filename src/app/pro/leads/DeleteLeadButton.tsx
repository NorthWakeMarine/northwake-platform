"use client";

import { useState } from "react";
import { deleteLead } from "@/app/actions";

export default function DeleteLeadButton({ leadId }: { leadId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!confirm) {
    return (
      <button
        onClick={(e) => { e.preventDefault(); setConfirm(true); }}
        className="text-[10px] tracking-widest uppercase text-red-400 hover:text-red-600 font-medium transition-colors whitespace-nowrap"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <button
        disabled={busy}
        onClick={async (e) => {
          e.preventDefault();
          setBusy(true);
          await deleteLead(leadId);
        }}
        className="text-[10px] tracking-widest uppercase text-red-600 font-semibold whitespace-nowrap disabled:opacity-50"
      >
        {busy ? "..." : "Confirm"}
      </button>
      <button
        onClick={(e) => { e.preventDefault(); setConfirm(false); }}
        className="text-[10px] text-slate-400 hover:text-slate-600"
      >
        Cancel
      </button>
    </span>
  );
}
