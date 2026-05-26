"use client";

import { useState } from "react";
import { createLeadFromCall } from "@/app/actions";

export default function CreateLeadButton({ phone, isLead }: { phone: string; isLead?: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "done">(isLead ? "done" : "idle");

  async function handle() {
    setState("loading");
    try {
      const result = await createLeadFromCall(phone);
      setState(result.ok ? "done" : "idle");
    } catch {
      setState("idle");
    }
  }

  if (state === "done") {
    return <span className="text-[9px] tracking-widest uppercase font-semibold text-emerald-600">Added</span>;
  }

  return (
    <button
      onClick={handle}
      disabled={state === "loading"}
      className="text-[9px] tracking-widest uppercase font-semibold px-1.5 py-0.5 rounded-sm bg-navy/10 text-navy border border-navy/20 hover:bg-navy/20 transition-colors disabled:opacity-50"
    >
      {state === "loading" ? "..." : "Lead"}
    </button>
  );
}
