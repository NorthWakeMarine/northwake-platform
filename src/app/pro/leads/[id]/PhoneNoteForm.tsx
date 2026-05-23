"use client";

import { useActionState } from "react";
import { savePhoneNote, type PhoneNoteState } from "@/app/actions";

export default function PhoneNoteForm({
  phone,
  initialNote,
}: {
  phone: string;
  initialNote: string | null;
}) {
  const [state, action, isPending] = useActionState<PhoneNoteState, FormData>(
    savePhoneNote,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="phone" value={phone} />
      <textarea
        name="note"
        rows={3}
        defaultValue={initialNote ?? ""}
        placeholder="Add a note about this caller, e.g. 'Asked about boat rentals'..."
        className="border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs px-3 py-2.5 rounded-sm resize-y focus:outline-none focus:border-[#000080] transition-colors leading-relaxed w-full md:rows-4"
      />
      {state.error && (
        <p className="text-red-500 text-[10px]">{state.error}</p>
      )}
      {state.success && (
        <p className="text-emerald-600 text-[10px] font-medium">Note saved.</p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="w-full md:w-auto bg-[#000080] hover:bg-[#0000a0] text-white text-[10px] tracking-widest uppercase px-5 py-3 min-h-[44px] rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isPending ? "Saving..." : "Save Note"}
        </button>
      </div>
    </form>
  );
}
