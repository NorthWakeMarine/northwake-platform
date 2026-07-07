"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reactivateLead } from "@/app/actions";

export default function ReactivateLeadButton({
  leadId,
  redirectTo,
  className,
}: {
  leadId: string;
  redirectTo?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <button
      disabled={busy}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setBusy(true);
        await reactivateLead(leadId);
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      }}
      className={className ?? "text-[10px] tracking-widest uppercase text-[#000080] hover:text-blue-800 font-semibold transition-colors whitespace-nowrap disabled:opacity-50"}
    >
      {busy ? "..." : "Restore"}
    </button>
  );
}
