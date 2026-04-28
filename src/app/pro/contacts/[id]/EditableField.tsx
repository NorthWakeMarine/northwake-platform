"use client";

import { useActionState, useState } from "react";
import { updateContactField, type ContactFieldState } from "@/app/actions";

export default function EditableField({
  contactId,
  field,
  value,
  placeholder,
}: {
  contactId: string;
  field: string;
  value: string | null;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, isPending] = useActionState<ContactFieldState, FormData>(
    updateContactField,
    {}
  );

  if (!editing) {
    return (
      <span
        className="group/field flex items-center gap-1.5 cursor-pointer"
        onClick={() => setEditing(true)}
      >
        {value
          ? <span className="text-slate-700">{value}</span>
          : <span className="text-slate-300">{placeholder ?? "Not provided"}</span>}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="text-slate-300 opacity-0 group-hover/field:opacity-100 transition-opacity shrink-0">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </span>
    );
  }

  return (
    <form
      action={async (fd) => {
        await action(fd);
        setEditing(false);
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="contact_id" value={contactId} />
      <input type="hidden" name="field" value={field} />
      <input
        name="value"
        defaultValue={value ?? ""}
        placeholder={placeholder}
        autoFocus
        className="border border-slate-300 rounded-sm px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#000080] min-w-0 flex-1"
        onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}
      />
      <button type="submit" disabled={isPending}
        className="text-[9px] tracking-widest uppercase text-[#000080] font-semibold disabled:opacity-50 whitespace-nowrap">
        {isPending ? "..." : "Save"}
      </button>
      <button type="button" onClick={() => setEditing(false)}
        className="text-[9px] text-slate-400 hover:text-slate-600 whitespace-nowrap">
        Cancel
      </button>
      {state.error && <p className="text-red-500 text-[11px]">{state.error}</p>}
    </form>
  );
}
