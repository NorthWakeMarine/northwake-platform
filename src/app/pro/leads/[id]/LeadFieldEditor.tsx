"use client";

import { useActionState, useRef, useState } from "react";
import { updateLeadField, type LeadFieldState } from "@/app/actions";

export default function LeadFieldEditor({
  leadId,
  field,
  label,
  value,
}: {
  leadId: string;
  field: string;
  label: string;
  value: string | null | undefined;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, action, isPending] = useActionState<LeadFieldState, FormData>(
    async (prev, formData) => {
      const result = await updateLeadField(prev, formData);
      if (result.success) setEditing(false);
      return result;
    },
    {}
  );

  if (!editing) {
    return (
      <div className="flex flex-col gap-0.5 group">
        <dt className="text-[10px] tracking-widest uppercase font-medium text-slate-400">{label}</dt>
        <dd className="flex items-center gap-2">
          <span className={value ? "text-slate-700 text-sm" : "text-slate-300 text-sm"}>
            {value || "Not provided"}
          </span>
          <button
            onClick={() => {
              setEditing(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            className="opacity-40 hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-[#000080] transition-all p-0.5 rounded"
            aria-label={`Edit ${label}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </dd>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] tracking-widest uppercase font-medium text-slate-400">{label}</dt>
      <form
        action={action}
        className="flex items-center gap-2"
        onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}
      >
        <input type="hidden" name="lead_id" value={leadId} />
        <input type="hidden" name="field" value={field} />
        <input
          ref={inputRef}
          name="value"
          defaultValue={value ?? ""}
          className="flex-1 min-w-0 border border-gray-500 focus:border-[#000080] bg-white text-slate-800 text-sm px-2 py-1 rounded-sm outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={isPending}
          className="text-[10px] tracking-widest uppercase bg-[#000080] hover:bg-[#0000a0] text-white px-3 py-1.5 rounded-sm disabled:opacity-50 transition-colors font-medium whitespace-nowrap"
        >
          {isPending ? "..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-slate-400 hover:text-slate-700 transition-colors p-1"
          aria-label="Cancel"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </form>
      {state.error && <p className="text-red-500 text-[10px]">{state.error}</p>}
    </div>
  );
}
