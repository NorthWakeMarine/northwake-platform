"use client";

import { useActionState, useRef } from "react";
import { addTimelineNote, type NoteState } from "@/app/actions";

export default function NoteForm({ contactId }: { contactId: string }) {
  const [state, action, isPending] = useActionState<NoteState, FormData>(addTimelineNote, {});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrappedAction = async (formData: FormData) => {
    await action(formData);
    if (textareaRef.current) textareaRef.current.value = "";
  };

  return (
    <form action={wrappedAction} className="flex flex-col gap-3">
      <input type="hidden" name="contact_id" value={contactId} />
      <textarea
        ref={textareaRef}
        name="body"
        rows={3}
        placeholder="Add a note..."
        required
        className="border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs px-3 py-2.5 rounded-sm resize-y focus:outline-none focus:border-blue-400 transition-colors leading-relaxed w-full"
      />
      {state.error && <p className="text-red-500 text-[10px]">{state.error}</p>}
      {state.success && (
        <p className="text-emerald-600 text-[10px] font-medium">Note saved.</p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="bg-[#000080] hover:bg-[#0000a0] text-white text-[10px] tracking-widest uppercase px-5 py-2 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isPending ? "Saving..." : "Save Note"}
        </button>
      </div>
    </form>
  );
}
