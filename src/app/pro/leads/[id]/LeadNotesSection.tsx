"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addLeadNote, updateTimelineNote, deleteTimelineNote, type NoteState, type LeadNote } from "@/app/actions";

type EditEntry = { edited_at: string; edited_by?: string };

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function NoteItem({ note, isLast, onDeleted }: { note: LeadNote; isLast: boolean; onDeleted: (id: string) => void }) {
  const [editing, setEditing]       = useState(false);
  const [draft, setDraft]           = useState(note.body ?? "");
  const [localBody, setLocalBody]   = useState(note.body ?? "");
  const [localEdits, setLocalEdits] = useState<EditEntry[]>(
    Array.isArray(note.metadata?.edit_history) ? (note.metadata!.edit_history as EditEntry[]) : []
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition]      = useTransition();
  const [error, setError]                 = useState("");

  const author = note.created_by && note.created_by !== "system" ? capitalize(note.created_by) : null;

  function handleSave() {
    if (!draft.trim()) return;
    startTransition(async () => {
      const res = await updateTimelineNote(note.id, draft);
      if (!res.ok) { setError(res.error ?? "Failed to save."); return; }
      setLocalEdits((prev) => [...prev, { edited_at: new Date().toISOString() }]);
      setLocalBody(draft);
      setEditing(false);
      setError("");
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteTimelineNote(note.id);
      if (!res.ok) { setError(res.error ?? "Failed to delete."); setConfirmDelete(false); return; }
      onDeleted(note.id);
    });
  }

  return (
    <li className={`flex gap-3 ${!isLast ? "border-b border-slate-100 pb-4 mb-4" : ""}`}>
      <div className="w-2 h-2 rounded-full bg-slate-400 shrink-0 mt-1.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  className="border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs px-3 py-2 rounded-sm resize-y focus:outline-none focus:border-[#000080] transition-colors leading-relaxed w-full"
                />
                {error && <p className="text-red-500 text-[10px]">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={isPending} className="bg-[#000080] hover:bg-[#0000a0] text-white text-[10px] tracking-widest uppercase px-4 py-1.5 rounded-sm disabled:opacity-50 transition-colors font-medium">
                    {isPending ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => { setEditing(false); setError(""); }} className="text-slate-400 hover:text-slate-600 text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-sm transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {localBody && <p className="text-slate-600 text-xs leading-relaxed">{localBody}</p>}
                {confirmDelete && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-red-500 text-[10px]">Delete this note?</span>
                    <button onClick={handleDelete} disabled={isPending} className="text-white bg-red-500 hover:bg-red-600 text-[10px] tracking-widest uppercase px-3 py-1 rounded-sm disabled:opacity-50 transition-colors font-medium">
                      {isPending ? "Deleting..." : "Delete"}
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="text-slate-400 hover:text-slate-600 text-[10px] tracking-widest uppercase px-2 py-1 rounded-sm transition-colors">
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          {!editing && !confirmDelete && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => { setDraft(localBody); setEditing(true); }} className="text-slate-300 hover:text-slate-500 transition-colors p-0.5" title="Edit note">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button onClick={() => setConfirmDelete(true)} className="text-slate-300 hover:text-red-400 transition-colors p-0.5" title="Delete note">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="mt-1 flex flex-col gap-0.5">
          <p className="text-slate-400 text-[10px]">{author ? `by ${author} · ` : ""}{fmtFull(note.created_at)}</p>
          {localEdits.map((e, i) => (
            <p key={i} className="text-slate-300 text-[10px]">
              edited{e.edited_by ? ` by ${capitalize(e.edited_by)}` : ""} · {fmtFull(e.edited_at)}
            </p>
          ))}
        </div>
      </div>
    </li>
  );
}

export default function LeadNotesSection({
  leadId,
  leadPhone,
  leadEmail,
  initialNotes,
}: {
  leadId: string;
  leadPhone?: string | null;
  leadEmail?: string | null;
  initialNotes: LeadNote[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [state, action, isPending] = useActionState<NoteState, FormData>(addLeadNote, {});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrappedAction = async (formData: FormData) => {
    await action(formData);
  };

  // Append new note to list when action succeeds
  const prevSuccessRef = useRef(false);
  useEffect(() => {
    if (state.success && state.note && !prevSuccessRef.current) {
      prevSuccessRef.current = true;
      setNotes((prev) => [...prev, state.note!]);
      if (textareaRef.current) textareaRef.current.value = "";
    }
    if (!state.success) prevSuccessRef.current = false;
  }, [state]);

  function handleDeleted(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      <form action={wrappedAction} className="flex flex-col gap-3">
        <input type="hidden" name="lead_id"    value={leadId} />
        {leadPhone && <input type="hidden" name="lead_phone" value={leadPhone} />}
        {leadEmail && <input type="hidden" name="lead_email" value={leadEmail} />}
        <textarea
          ref={textareaRef}
          name="body"
          rows={3}
          placeholder="Add a note..."
          required
          className="border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs px-3 py-2.5 rounded-sm resize-y focus:outline-none focus:border-[#000080] transition-colors leading-relaxed w-full"
        />
        {state.error && <p className="text-red-500 text-[10px]">{state.error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="bg-[#000080] hover:bg-[#0000a0] text-white text-[10px] tracking-widest uppercase px-5 py-3 min-h-[44px] rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isPending ? "Saving..." : "Save Note"}
          </button>
        </div>
      </form>

      {notes.length > 0 && (
        <ul className="mt-1 flex flex-col">
          {notes.map((note, i) => (
            <NoteItem key={note.id} note={note} isLast={i === notes.length - 1} onDeleted={handleDeleted} />
          ))}
        </ul>
      )}
      {notes.length === 0 && (
        <p className="text-slate-400 text-xs">No notes yet. Add one above.</p>
      )}
    </div>
  );
}
