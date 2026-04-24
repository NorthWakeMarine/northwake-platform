"use client";

import { useActionState, useState, useEffect } from "react";
import {
  createStandaloneEvent,
  updateStandaloneEvent,
  deleteStandaloneEvent,
  type CalendarEventState,
} from "@/app/actions";
import type { CalendarEvent } from "@/lib/google-calendar";

function fmtDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(iso: string) {
  if (!iso) return "";
  if (!iso.includes("T")) return "All day";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function toLocalDateTimeInput(iso: string) {
  if (!iso || !iso.includes("T")) return iso ?? "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Event Modal ────────────────────────────────────────────────────────────────

function EventModal({
  event,
  onClose,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
}) {
  const isEdit = !!event;
  const [createState, createAction, creating] = useActionState<CalendarEventState, FormData>(
    createStandaloneEvent,
    {}
  );
  const [updateState, updateAction, updating] = useActionState<CalendarEventState, FormData>(
    updateStandaloneEvent,
    {}
  );

  const state  = isEdit ? updateState : createState;
  const action = isEdit ? updateAction : createAction;
  const busy   = isEdit ? updating    : creating;

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-slate-800 text-sm font-semibold">
            {isEdit ? "Edit Event" : "New Calendar Event"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
        </div>
        <form action={action} className="px-6 py-5 flex flex-col gap-4">
          {isEdit && <input type="hidden" name="event_id" value={event.id} />}

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Title</label>
            <input
              name="title"
              required
              defaultValue={event?.title ?? ""}
              placeholder="e.g. Engine Service — Hull Breaker"
              className="border border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000080]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Start</label>
              <input
                type="datetime-local"
                name="start_time"
                required
                defaultValue={event ? toLocalDateTimeInput(event.start) : ""}
                className="border border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000080]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">End</label>
              <input
                type="datetime-local"
                name="end_time"
                required
                defaultValue={event ? toLocalDateTimeInput(event.end) : ""}
                className="border border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000080]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Location</label>
            <input
              name="location"
              defaultValue={event?.location ?? ""}
              placeholder="Marina slip, address, etc."
              className="border border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000080]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Notes</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={event?.description ?? ""}
              placeholder="Service details, access info, etc."
              className="border border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000080] resize-none"
            />
          </div>

          {state.error && (
            <p className="text-red-600 text-xs">{state.error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 bg-[#000080] text-white text-xs font-semibold py-2.5 rounded-sm hover:bg-blue-900 transition-colors disabled:opacity-50"
            >
              {busy ? "Saving..." : isEdit ? "Save Changes" : "Create Event"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 text-slate-500 text-xs font-medium hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteConfirm({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setBusy(true);
    const res = await deleteStandaloneEvent(event.id);
    if (res.error) { setError(res.error); setBusy(false); }
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <h2 className="text-slate-800 text-sm font-semibold">Delete Event?</h2>
        <p className="text-slate-500 text-xs leading-relaxed">
          This will permanently delete <span className="font-semibold text-slate-700">{event.title}</span> from Google Calendar. This cannot be undone.
        </p>
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={busy}
            className="flex-1 bg-red-600 text-white text-xs font-semibold py-2.5 rounded-sm hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {busy ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={onClose}
            className="px-4 text-slate-500 text-xs font-medium hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Client ────────────────────────────────────────────────────────────────

export default function CalendarClient({ events }: { events: CalendarEvent[] }) {
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  function openCreate() { setSelected(null); setModal("create"); }
  function openEdit(e: CalendarEvent) { setSelected(e); setModal("edit"); }
  function openDelete(e: CalendarEvent) { setSelected(e); setModal("delete"); }
  function closeModal() { setModal(null); setSelected(null); }

  const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    const key = fmtDate(ev.start);
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  return (
    <>
      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-xl font-bold tracking-tight">Calendar</h1>
          <p className="text-slate-400 text-xs mt-0.5">Upcoming jobs and appointments synced with Google Calendar.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#000080] text-white text-xs font-semibold px-4 py-2.5 rounded-sm hover:bg-blue-900 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Event
        </button>
      </div>

      {/* Event list */}
      <div className="flex-1 px-8 py-6">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p className="text-slate-400 text-sm">No upcoming events in the next 14 days.</p>
            <button onClick={openCreate} className="text-[#000080] text-xs font-semibold hover:underline">
              Create your first event
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-2xl">
            {Object.entries(grouped).map(([day, dayEvents]) => (
              <div key={day}>
                <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mb-2">{day}</p>
                <div className="flex flex-col gap-2">
                  {dayEvents.map((ev) => (
                    <div key={ev.id} className="bg-white border border-slate-200 rounded-sm px-5 py-4 flex items-start justify-between gap-4 group hover:border-slate-300 transition-colors">
                      <div className="flex gap-4 items-start min-w-0">
                        <div className="w-1.5 h-full min-h-[2.5rem] rounded-full bg-[#000080] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-slate-800 text-sm font-semibold truncate">{ev.title}</p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {fmtTime(ev.start)}
                            {ev.end && ev.end !== ev.start && ` — ${fmtTime(ev.end)}`}
                          </p>
                          {ev.location && (
                            <p className="text-slate-400 text-[11px] mt-0.5 truncate">{ev.location}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(ev)}
                          className="text-[10px] tracking-widest uppercase text-slate-400 hover:text-[#000080] font-semibold px-2 py-1 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(ev)}
                          className="text-[10px] tracking-widest uppercase text-slate-400 hover:text-red-500 font-semibold px-2 py-1 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {(modal === "create" || modal === "edit") && (
        <EventModal event={modal === "edit" ? selected : null} onClose={closeModal} />
      )}
      {modal === "delete" && selected && (
        <DeleteConfirm event={selected} onClose={closeModal} />
      )}
    </>
  );
}
