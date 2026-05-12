"use client";

import { useState, useTransition } from "react";
import { registerCalendarWebhook, registerDialpadWebhook } from "@/app/actions";

export function DialpadWebhookButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok?: boolean; id?: string; existing?: boolean; error?: string } | null>(null);

  function handleRegister() {
    startTransition(async () => {
      const res = await registerDialpadWebhook();
      setResult(res);
    });
  }

  if (result?.ok) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          {result.existing ? "Webhook already registered" : "Webhook registered"}
        </div>
        <p className="text-slate-400 text-[10px] leading-relaxed">
          Dialpad will now POST call and SMS events directly to your CRM.
          {result.id && ` Subscription ID: ${result.id}`}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {result?.error && (
        <p className="text-red-500 text-[10px] leading-relaxed">{result.error}</p>
      )}
      <button
        onClick={handleRegister}
        disabled={pending}
        className="w-full bg-[#000080] text-white text-[10px] tracking-widest uppercase py-2.5 rounded-sm font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50"
      >
        {pending ? "Registering..." : "Register Webhook"}
      </button>
      <p className="text-slate-400 text-[10px] leading-relaxed">
        Registers your CRM as a Dialpad event subscriber. One-time setup.
      </p>
    </div>
  );
}

export default function CalendarRegisterButton({ expires, calendarConnected }: { expires: string | null; calendarConnected: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok?: boolean; expires?: string; error?: string } | null>(null);

  const isConnected = calendarConnected || (expires && new Date(expires) > new Date());

  function handleRegister() {
    startTransition(async () => {
      const res = await registerCalendarWebhook();
      setResult(res);
    });
  }

  if (result?.ok || isConnected) {
    const expiry = result?.expires ?? expires!;
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Webhook active
        </div>
        <p className="text-slate-400 text-[10px]">
          Auto-renews daily. Next expiry: {new Date(expiry).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.
        </p>
        <button
          onClick={handleRegister}
          disabled={pending}
          className="w-full border border-slate-200 text-slate-400 text-[10px] tracking-widest uppercase py-2.5 rounded-sm font-medium hover:border-slate-300 hover:text-slate-500 transition-colors disabled:opacity-50"
        >
          {pending ? "Re-registering..." : "Force Re-register"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {result?.error && (
        <p className="text-red-500 text-[10px] leading-relaxed">{result.error}</p>
      )}
      <button
        onClick={handleRegister}
        disabled={pending}
        className="w-full bg-[#000080] text-white text-[10px] tracking-widest uppercase py-2.5 rounded-sm font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50"
      >
        {pending ? "Registering..." : "Register Webhook"}
      </button>
      <p className="text-slate-400 text-[10px] leading-relaxed">
        One-time setup. The daily cron renews it automatically after this.
      </p>
    </div>
  );
}
