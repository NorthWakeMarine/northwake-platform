"use client";

import { useState, useTransition } from "react";
import { updateTimelineNote, deleteTimelineNote, deleteTimelineEvent } from "@/app/actions";

type EditEntry = { edited_at: string; edited_by?: string };

type TimelineEvent = {
  id: string;
  created_at: string;
  event_type: string;
  title: string | null;
  body: string | null;
  created_by: string | null;
  metadata?: Record<string, unknown> | null;
};

const eventConfig: Record<string, { dot: string; label: string }> = {
  lead_created:           { dot: "bg-blue-500",    label: "Lead Created" },
  form_submission:        { dot: "bg-blue-400",    label: "Form Submitted" },
  note:                   { dot: "bg-slate-400",   label: "Note" },
  call:                   { dot: "bg-purple-500",  label: "Call" },
  sms:                    { dot: "bg-purple-400",  label: "SMS" },
  waiver_signed:          { dot: "bg-emerald-500", label: "Waiver Signed" },
  invoice:                { dot: "bg-amber-500",   label: "Invoice" },
  payment:                { dot: "bg-green-600",   label: "Payment Received" },
  lead_converted:         { dot: "bg-emerald-600", label: "Converted to Client" },
  web_lead:               { dot: "bg-blue-300",    label: "Web Lead Merged" },
  appointment_scheduled:  { dot: "bg-indigo-500",  label: "Appointment Scheduled" },
  calendar_discrepancy:   { dot: "bg-red-400",     label: "Calendar Discrepancy" },
};

const HUMAN_EVENT_TYPES = new Set([
  "note", "call", "sms", "invoice", "payment", "waiver_signed", "appointment_scheduled",
]);

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function NoteItem({ ev, isLast }: { ev: TimelineEvent; isLast: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(ev.body ?? "");
  const [localBody, setLocalBody] = useState(ev.body ?? "");
  const [localEdits, setLocalEdits] = useState<EditEntry[]>(
    Array.isArray(ev.metadata?.edit_history) ? (ev.metadata!.edit_history as EditEntry[]) : []
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const dot = eventConfig.note.dot;

  function handleSave() {
    if (!draft.trim()) return;
    startTransition(async () => {
      const res = await updateTimelineNote(ev.id, draft);
      if (!res.ok) { setError(res.error ?? "Failed to save."); return; }
      const newEdit = { edited_at: new Date().toISOString() };
      setLocalEdits((prev) => [...prev, newEdit]);
      setLocalBody(draft);
      setEditing(false);
      setError("");
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteTimelineNote(ev.id);
      if (!res.ok) { setError(res.error ?? "Failed to delete."); setConfirmDelete(false); }
    });
  }

  const author = ev.created_by && ev.created_by !== "system" ? capitalize(ev.created_by) : null;

  return (
    <li className="flex gap-4 relative">
      {!isLast && <div className="absolute left-[5px] top-4 bottom-0 w-px bg-slate-100" />}
      <div className="pt-0.5 shrink-0">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 block ${dot}`} />
      </div>
      <div className="pb-5 flex-1 min-w-0 flex gap-3">

        {/* Left: label + body */}
        <div className="flex-1 min-w-0">
          <span className="text-slate-700 text-xs font-medium">Note</span>

          {editing ? (
            <div className="mt-1.5 flex flex-col gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                className="border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs px-3 py-2 rounded-sm resize-y focus:outline-none focus:border-blue-400 transition-colors leading-relaxed w-full"
              />
              {error && <p className="text-red-500 text-[10px]">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="bg-[#000080] hover:bg-[#0000a0] text-white text-[10px] tracking-widest uppercase px-4 py-1.5 rounded-sm disabled:opacity-50 transition-colors font-medium"
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => { setEditing(false); setError(""); }}
                  className="text-slate-400 hover:text-slate-600 text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {localBody && (
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{localBody}</p>
              )}
              {confirmDelete && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-red-500 text-[10px]">Delete this note?</span>
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="text-white bg-red-500 hover:bg-red-600 text-[10px] tracking-widest uppercase px-3 py-1 rounded-sm disabled:opacity-50 transition-colors font-medium"
                  >
                    {isPending ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-slate-400 hover:text-slate-600 text-[10px] tracking-widest uppercase px-2 py-1 rounded-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: actions + attribution */}
        <div className="flex flex-col items-end gap-1 shrink-0 text-right">
          {!editing && !confirmDelete && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setDraft(localBody); setEditing(true); }}
                className="text-slate-300 hover:text-slate-500 transition-colors p-0.5"
                title="Edit note"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-slate-300 hover:text-red-400 transition-colors p-0.5"
                title="Delete note"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          )}
          <p className="text-slate-300 text-[10px] whitespace-nowrap">
            {author ? `by ${author} · ` : ""}{fmtFull(ev.created_at)}
          </p>
          {localEdits.map((e, i) => (
            <p key={i} className="text-slate-300 text-[10px] whitespace-nowrap">
              edited{e.edited_by ? ` by ${capitalize(e.edited_by)}` : ""} · {fmtFull(e.edited_at)}
            </p>
          ))}
        </div>

      </div>
    </li>
  );
}

function StaticItem({ ev, isLast }: { ev: TimelineEvent; isLast: boolean }) {
  const cfg = eventConfig[ev.event_type] ?? { dot: "bg-slate-300", label: ev.event_type };
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteTimelineEvent(ev.id);
    });
  }

  return (
    <li className="flex gap-4 relative group">
      {!isLast && <div className="absolute left-[5px] top-4 bottom-0 w-px bg-slate-100" />}
      <div className="pt-0.5 shrink-0">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 block ${cfg.dot}`} />
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-700 text-xs font-medium">{cfg.label}</span>
          {ev.title && !["Lead created", "Note added", "New form submission"].includes(ev.title) && (
            <span className="text-slate-500 text-xs">{ev.title}</span>
          )}
          <span className="text-slate-300 text-[10px] ml-auto whitespace-nowrap">{fmtFull(ev.created_at)}</span>
          {!confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all p-0.5 ml-1"
              title="Delete event"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
        </div>
        {ev.body && (
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">{ev.body}</p>
        )}
        {ev.created_by && ev.created_by !== "system" && (
          <p className="text-slate-300 text-[10px] mt-0.5">by {capitalize(ev.created_by)}</p>
        )}
        {confirmDelete && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-red-500 text-[10px]">Delete this event?</span>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-white bg-red-500 hover:bg-red-600 text-[10px] tracking-widest uppercase px-3 py-1 rounded-sm disabled:opacity-50 transition-colors font-medium"
            >
              {isPending ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-slate-400 hover:text-slate-600 text-[10px] tracking-widest uppercase px-2 py-1 rounded-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export function NotesList({ events }: { events: TimelineEvent[] }) {
  const notes = events.filter((ev) => ev.event_type === "note");
  if (notes.length === 0) {
    return <p className="text-slate-400 text-xs px-1 py-3 italic">No notes yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-0 mt-1">
      {notes.map((ev, i) => (
        <NoteItem key={ev.id} ev={ev} isLast={i === notes.length - 1} />
      ))}
    </ul>
  );
}

export default function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  const [cleanView, setCleanView] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem("nwm_clean_view") === "1"; } catch { return false; }
  });

  function toggleCleanView() {
    const next = !cleanView;
    setCleanView(next);
    try { localStorage.setItem("nwm_clean_view", next ? "1" : "0"); } catch { /* ignore */ }
  }

  const nonNotes = events.filter((ev) => ev.event_type !== "note");
  const visible = cleanView
    ? nonNotes.filter((ev) => HUMAN_EVENT_TYPES.has(ev.event_type) && ev.created_by !== "system")
    : nonNotes;

  return (
    <div>
      <div className="px-6 py-2 border-b border-slate-50 flex justify-end">
        <button
          onClick={toggleCleanView}
          className={`text-[10px] tracking-widest uppercase font-medium transition-colors ${
            cleanView ? "text-[#000080]" : "text-slate-300 hover:text-slate-500"
          }`}
        >
          {cleanView ? "Clean View On" : "Clean View"}
        </button>
      </div>
      <div className="max-h-[560px] overflow-y-auto">
        {visible.length === 0 ? (
          <p className="text-slate-400 text-sm px-6 py-8">No activity yet.</p>
        ) : (
          <ul className="px-6 py-4 flex flex-col gap-0">
            {visible.map((ev, i) => (
              <StaticItem key={ev.id} ev={ev} isLast={i === visible.length - 1} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
