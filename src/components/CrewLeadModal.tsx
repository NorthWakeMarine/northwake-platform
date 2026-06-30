"use client";

import { useActionState, useEffect, useRef } from "react";
import { createFieldLead } from "@/app/actions";

const SERVICES = [
  "Maintenance Wash",
  "Detail / Wax",
  "Outboard Engine Service",
  "Outboard Diagnostics",
  "Bottom Paint",
  "Boat Transport",
  "Interior Cleaning",
  "General Inquiry",
];

export default function CrewLeadModal({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(createFieldLead, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      const t = setTimeout(onClose, 800);
      return () => clearTimeout(t);
    }
  }, [state.success, onClose]);

  const label = "block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1";
  const input = "w-full bg-white/[0.06] border border-white/[0.12] rounded-sm px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#4a90d9]";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0d0d24] border-t border-white/[0.08] rounded-t-2xl pb-[env(safe-area-inset-bottom)] max-h-[92dvh] flex flex-col">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] shrink-0">
          <h2 className="text-white font-semibold text-base">New Lead</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">&times;</button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1">
          <form ref={formRef} action={action} className="px-5 py-4 flex flex-col gap-4">

            <div>
              <label className={label}>Name</label>
              <input name="name" type="text" placeholder="Full name" autoComplete="off" className={input} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Phone</label>
                <input name="phone" type="tel" placeholder="(904) 555-0100" inputMode="tel" className={input} />
              </div>
              <div>
                <label className={label}>Email</label>
                <input name="email" type="email" placeholder="email@example.com" inputMode="email" className={input} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Boat Year</label>
                <input name="year" type="text" placeholder="2021" inputMode="numeric" maxLength={4} className={input} />
              </div>
              <div>
                <label className={label}>Make / Model</label>
                <input name="make" type="text" placeholder="Sea Ray 270" className={input} />
              </div>
            </div>

            <div>
              <label className={label}>Service Interested In</label>
              <select name="service" className={`${input} appearance-none`} defaultValue="">
                <option value="" disabled className="bg-[#0d0d24]">Select a service...</option>
                {SERVICES.map(s => (
                  <option key={s} value={s} className="bg-[#0d0d24]">{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={label}>Boat Location / Slip</label>
              <input name="location" type="text" placeholder="Ortega River Marina, Slip 14" className={input} />
            </div>

            <div>
              <label className={label}>Notes</label>
              <textarea name="notes" rows={3} placeholder="Anything else worth noting..." className={`${input} resize-none`} />
            </div>

            {state.error && (
              <p className="text-red-400 text-xs">{state.error}</p>
            )}

            {state.success ? (
              <p className="text-emerald-400 text-sm font-semibold text-center py-2">Lead saved!</p>
            ) : (
              <button
                type="submit"
                disabled={pending}
                className="w-full bg-[#000080] hover:bg-blue-900 disabled:opacity-40 text-white font-semibold text-sm py-3 rounded-sm transition-colors"
              >
                {pending ? "Saving..." : "Save Lead"}
              </button>
            )}

          </form>
        </div>
      </div>
    </>
  );
}
