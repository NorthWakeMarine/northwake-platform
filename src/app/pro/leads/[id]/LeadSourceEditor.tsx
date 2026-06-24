"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { updateLeadField, type LeadFieldState } from "@/app/actions";

const SOURCE_OPTIONS = [
  { value: "quo",        label: "Quo" },
  { value: "google",     label: "Google" },
  { value: "meta",       label: "Meta" },
  { value: "website",    label: "Website" },
  { value: "hero",       label: "Website — Hero Form" },
  { value: "contact",    label: "Website — Contact Form" },
  { value: "manual",     label: "Manual Entry" },
  { value: "waiver",     label: "Liability Waiver" },
  { value: "google_ads", label: "Google Ads" },
  { value: "api",        label: "API Ingest" },
  { value: "service_reminder", label: "Service Reminder" },
];

export default function LeadSourceEditor({
  leadId,
  currentSource,
}: {
  leadId: string;
  currentSource: string;
}) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const [state, action, isPending] = useActionState<LeadFieldState, FormData>(
    async (prev, formData) => {
      const result = await updateLeadField(prev, formData);
      if (result.success) {
        setEditing(false);
        router.refresh();
      }
      return result;
    },
    {}
  );

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-[10px] tracking-widest uppercase font-medium text-[#000080] hover:underline transition-colors mt-2"
      >
        Edit Source
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2 mt-2">
      <input type="hidden" name="lead_id" value={leadId} />
      <input type="hidden" name="field" value="source" />
      <select
        name="value"
        defaultValue={currentSource}
        className="flex-1 min-w-0 border border-gray-500 focus:border-[#000080] bg-white text-slate-800 text-sm px-2 py-1 rounded-sm outline-none transition-colors"
      >
        {SOURCE_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
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
      {state.error && <p className="text-red-500 text-[10px] w-full mt-1">{state.error}</p>}
    </form>
  );
}
