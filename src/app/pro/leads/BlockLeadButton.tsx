"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { blockLead } from "@/app/actions";

export default function BlockLeadButton({ leadId }: { leadId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (!confirm) {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirm(true); }}
        className="text-[10px] tracking-widest uppercase text-orange-400 hover:text-orange-600 font-medium transition-colors whitespace-nowrap"
      >
        Block
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <button
        disabled={busy}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          setBusy(true);
          await blockLead(leadId);
          router.push("/pro/leads");
        }}
        className="text-[10px] tracking-widest uppercase text-orange-600 font-semibold whitespace-nowrap disabled:opacity-50"
      >
        {busy ? "..." : "Confirm Block"}
      </button>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirm(false); }}
        className="text-[10px] text-slate-400 hover:text-slate-600"
      >
        Cancel
      </button>
    </span>
  );
}
