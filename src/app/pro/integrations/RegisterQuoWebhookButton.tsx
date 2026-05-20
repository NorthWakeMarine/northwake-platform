"use client";

import { useState, useTransition } from "react";
import { registerQuoWebhook } from "@/app/actions";

export default function RegisterQuoWebhookButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; webhookId?: string; error?: string } | null>(null);

  function handle() {
    startTransition(async () => {
      const res = await registerQuoWebhook();
      setResult(res);
    });
  }

  if (result?.ok) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Webhook registered
        </div>
        <button
          onClick={handle}
          disabled={pending}
          className="w-full border border-slate-200 text-slate-400 text-[10px] tracking-widest uppercase py-2.5 rounded-sm font-medium hover:border-slate-300 hover:text-slate-500 transition-colors disabled:opacity-50"
        >
          {pending ? "Re-registering..." : "Force Re-register"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {result?.error && (
        <p className="text-red-500 text-[10px] leading-relaxed">{result.error}</p>
      )}
      <button
        onClick={handle}
        disabled={pending}
        className="w-full bg-[#000080] text-white text-[10px] tracking-widest uppercase py-2.5 rounded-sm font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50"
      >
        {pending ? "Registering..." : "Register Webhook"}
      </button>
      <p className="text-slate-400 text-[10px] leading-relaxed">
        Subscribes to call and SMS events from Quo so they appear in the CRM automatically.
      </p>
    </div>
  );
}
