"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { blockContact } from "@/app/actions";

export default function BlockContactButton({
  contactId,
  redirectTo,
}: {
  contactId: string;
  redirectTo?: string;
}) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (!confirm) {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirm(true); }}
        className="text-[10px] tracking-widest uppercase text-red-400 hover:text-red-600 font-medium transition-colors whitespace-nowrap"
      >
        Block Number
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
          const res = await blockContact(contactId);
          if (!res.error) {
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
          } else {
            setBusy(false);
          }
        }}
        className="text-[10px] tracking-widest uppercase text-red-600 font-semibold whitespace-nowrap disabled:opacity-50"
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
