"use client";

import { useState, useTransition } from "react";
import { updateContactFields } from "@/app/actions";

export default function VendorDescriptor({ contactId, initialNotes }: { contactId: string; initialNotes: string | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateContactFields(contactId, { notes: value.trim() || null });
      setSaved(value.trim());
      setEditing(false);
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-sm px-6 py-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400">Vendor Description</p>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-slate-300 hover:text-slate-500 transition-colors"
            title="Edit description"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={() => { setValue(saved); setEditing(false); }} className="text-slate-400 text-[10px] tracking-widest uppercase font-medium hover:text-slate-600 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={isPending} className="text-[#000080] text-[10px] tracking-widest uppercase font-semibold hover:text-[#0000a0] transition-colors disabled:opacity-50">
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          autoFocus
          placeholder="Describe what this vendor provides, contact notes, terms..."
          className="w-full border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-[#000080] resize-none"
        />
      ) : (
        <p className={`text-sm leading-relaxed ${saved ? "text-slate-700" : "text-slate-300 italic"}`}>
          {saved || "No description yet. Click edit to add one."}
        </p>
      )}
    </div>
  );
}
