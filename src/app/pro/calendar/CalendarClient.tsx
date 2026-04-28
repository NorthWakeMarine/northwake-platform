"use client";

import { useActionState, useState, useEffect } from "react";
import {
  createStandaloneEvent,
  updateStandaloneEvent,
  deleteStandaloneEvent,
  type CalendarEventState,
} from "@/app/actions";
import type { CalendarEvent } from "@/lib/google-calendar";

// ── Date utils ─────────────────────────────────────────────────────────────────

function startOfWeek(d: Date): Date {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  s.setHours(0, 0, 0, 0);
  return s;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function eventDay(iso: string): Date {
  if (!iso.includes("T")) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(iso);
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/ol>|<\/ul>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fmtWeekRange(start: Date): string {
  const end = addDays(start, 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = start.toLocaleDateString("en-US", opts);
  const e = end.toLocaleDateString("en-US", {
    month: start.getMonth() === end.getMonth() ? undefined : "short",
    day: "numeric",
  });
  return `${s} – ${e}, ${start.getFullYear()}`;
}

function fmtTime(iso: string): string {
  if (!iso.includes("T")) return "All day";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function toLocalDateTimeInput(iso: string): string {
  if (!iso || !iso.includes("T")) return iso ?? "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ── Event Detail Modal ─────────────────────────────────────────────────────────

function EventDetailModal({ event, onEdit, onDelete, onClose }: {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const isAllDay = !event.start.includes("T");
  const dateStr = isAllDay
    ? new Date(...(event.start.split("-").map(Number) as [number, number, number]).map((v, i) => i === 1 ? v - 1 : v) as [number, number, number]).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : new Date(event.start).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const timeStr = isAllDay ? "All day" : `${fmtTime(event.start)} – ${fmtTime(event.end)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-slate-900 text-base font-bold leading-snug">{event.title}</h2>
            <p className="text-slate-500 text-xs mt-1">{dateStr} &middot; {timeStr}</p>
            {event.location && (
              <p className="text-slate-400 text-xs mt-0.5">{event.location}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none shrink-0">&times;</button>
        </div>

        {event.description && (
          <div className="px-6 py-4 overflow-y-auto flex-1">
            <div
              className="prose prose-sm prose-slate max-w-none text-slate-700 text-sm leading-relaxed [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={onEdit}
            className="flex-1 bg-[#000080] text-white text-xs font-semibold py-2.5 rounded-sm hover:bg-blue-900 transition-colors"
          >
            Edit Event
          </button>
          <button
            onClick={onDelete}
            className="px-4 text-red-500 text-xs font-medium hover:text-red-700 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="px-4 text-slate-500 text-xs font-medium hover:text-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Event Modal ────────────────────────────────────────────────────────────────

function EventModal({ event, defaultDate, onClose }: {
  event: CalendarEvent | null;
  defaultDate?: string;
  onClose: () => void;
}) {
  const isEdit = !!event;
  const [createState, createAction, creating] = useActionState<CalendarEventState, FormData>(createStandaloneEvent, {});
  const [updateState, updateAction, updating] = useActionState<CalendarEventState, FormData>(updateStandaloneEvent, {});

  const state  = isEdit ? updateState : createState;
  const action = isEdit ? updateAction : createAction;
  const busy   = isEdit ? updating    : creating;

  useEffect(() => { if (state.success) onClose(); }, [state.success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-slate-800 text-sm font-semibold">{isEdit ? "Edit Event" : "New Event"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <form action={action} className="px-6 py-5 flex flex-col gap-4">
          {isEdit && <input type="hidden" name="event_id" value={event.id} />}
          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Title</label>
            <input name="title" required defaultValue={event?.title ?? ""}
              placeholder="e.g. Wash + Wax — Hull Breaker"
              className="border border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000080]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Start</label>
              <input type="datetime-local" name="start_time" required
                defaultValue={event ? toLocalDateTimeInput(event.start) : defaultDate ?? ""}
                className="border border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000080]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">End</label>
              <input type="datetime-local" name="end_time" required
                defaultValue={event ? toLocalDateTimeInput(event.end) : defaultDate ?? ""}
                className="border border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000080]" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Location</label>
            <input name="location" defaultValue={event?.location ?? ""}
              placeholder="Marina slip, address, etc."
              className="border border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000080]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Notes</label>
            <textarea name="description" rows={4} defaultValue={event?.description ? htmlToPlainText(event.description) : ""}
              placeholder="Service details, access info, etc."
              className="border border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000080] resize-none" />
          </div>
          {state.error && <p className="text-red-600 text-xs">{state.error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={busy}
              className="flex-1 bg-[#000080] text-white text-xs font-semibold py-2.5 rounded-sm hover:bg-blue-900 transition-colors disabled:opacity-50">
              {busy ? "Saving..." : isEdit ? "Save Changes" : "Create Event"}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 text-slate-500 text-xs font-medium hover:text-slate-800 transition-colors">
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
          This will permanently delete <span className="font-semibold text-slate-700">{event.title}</span> from Google Calendar.
        </p>
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <div className="flex gap-3">
          <button onClick={handleDelete} disabled={busy}
            className="flex-1 bg-red-600 text-white text-xs font-semibold py-2.5 rounded-sm hover:bg-red-700 transition-colors disabled:opacity-50">
            {busy ? "Deleting..." : "Delete"}
          </button>
          <button onClick={onClose}
            className="px-4 text-slate-500 text-xs font-medium hover:text-slate-800 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Week Grid ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function WeekGrid({ weekStart, events, today, onDayClick, onEventClick, onDeleteClick }: {
  weekStart: Date;
  events: CalendarEvent[];
  today: Date;
  onDayClick: (iso: string) => void;
  onEventClick: (e: CalendarEvent) => void;
  onDeleteClick: (e: CalendarEvent) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="grid grid-cols-7 flex-1 divide-x divide-slate-100 border border-slate-200 rounded-sm overflow-hidden bg-white">
      {days.map((day, i) => {
        const isToday = isSameDay(day, today);
        const dayEvents = events.filter(ev => isSameDay(eventDay(ev.start), day));
        const dateLabel = day.getDate();
        const monthLabel = day.toLocaleDateString("en-US", { month: "short" });

        return (
          <div key={i} className="flex flex-col min-h-0">
            {/* Day header */}
            <div
              className={`px-2 py-2.5 text-center border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${isToday ? "bg-[#000080]/5" : ""}`}
              onClick={() => {
                const p = (n: number) => String(n).padStart(2, "0");
                onDayClick(`${day.getFullYear()}-${p(day.getMonth() + 1)}-${p(day.getDate())}T09:00`);
              }}
            >
              <p className={`text-[10px] font-semibold tracking-widest uppercase ${isToday ? "text-[#000080]" : "text-slate-400"}`}>
                {DAY_LABELS[i]}
              </p>
              <div className={`mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full text-sm font-bold ${isToday ? "bg-[#000080] text-white" : "text-slate-700"}`}>
                {dateLabel}
              </div>
              {isToday && (
                <p className="text-[8px] text-[#000080] font-semibold tracking-widest uppercase mt-0.5">Today</p>
              )}
              {!isToday && (
                <p className="text-[8px] text-slate-300 mt-0.5">{monthLabel}</p>
              )}
            </div>

            {/* Events */}
            <div className="flex-1 p-1.5 flex flex-col gap-1 overflow-y-auto">
              {dayEvents.length === 0 && (
                <div className="flex-1" />
              )}
              {dayEvents.map(ev => (
                <div
                  key={ev.id}
                  className="group relative bg-[#000080]/8 border border-[#000080]/20 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-[#000080]/15 transition-colors"
                  onClick={() => onEventClick(ev)}
                >
                  <p className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-2">{ev.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{fmtTime(ev.start)}</p>
                  {ev.location && (
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">{ev.location}</p>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteClick(ev); }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all text-xs leading-none w-4 h-4 flex items-center justify-center"
                    title="Delete"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Client ────────────────────────────────────────────────────────────────

export default function CalendarClient({ events }: { events: CalendarEvent[] }) {
  const today      = new Date();
  today.setHours(0, 0, 0, 0);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [modal, setModal]         = useState<"create" | "detail" | "edit" | "delete" | null>(null);
  const [selected, setSelected]   = useState<CalendarEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  function prevWeek() { setWeekStart(d => addDays(d, -7)); }
  function nextWeek() { setWeekStart(d => addDays(d, 7)); }
  function goToday()  { setWeekStart(startOfWeek(today)); }

  function openCreate(iso?: string) { setDefaultDate(iso); setSelected(null); setModal("create"); }
  function openDetail(ev: CalendarEvent) { setSelected(ev); setModal("detail"); }
  function openEdit(ev: CalendarEvent) { setSelected(ev); setModal("edit"); }
  function openDelete(ev: CalendarEvent) { setSelected(ev); setModal("delete"); }
  function closeModal() { setModal(null); setSelected(null); setDefaultDate(undefined); }

  const isCurrentWeek = isSameDay(weekStart, startOfWeek(today));

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0">

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Nav arrows */}
            <div className="flex items-center gap-1">
              <button onClick={prevWeek}
                className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button onClick={nextWeek}
                className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <div>
              <h1 className="text-slate-900 text-base font-bold tracking-tight">{fmtWeekRange(weekStart)}</h1>
              <p className="text-slate-400 text-[10px] mt-0.5">Calendar</p>
            </div>

            {!isCurrentWeek && (
              <button onClick={goToday}
                className="text-[10px] tracking-widest uppercase text-[#000080] font-semibold border border-[#000080]/30 px-2.5 py-1 rounded-sm hover:bg-[#000080]/5 transition-colors">
                Today
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-slate-200 text-slate-500 text-[10px] tracking-widest uppercase font-semibold px-3 py-2 rounded-sm hover:border-slate-300 hover:text-slate-700 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open Google Calendar
            </a>
            <button onClick={() => openCreate()}
              className="flex items-center gap-1.5 bg-[#000080] text-white text-[10px] tracking-widest uppercase font-semibold px-3 py-2 rounded-sm hover:bg-blue-900 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Event
            </button>
          </div>
        </div>

        {/* Week grid */}
        <div className="flex-1 px-6 py-4 min-h-0 overflow-auto">
          <WeekGrid
            weekStart={weekStart}
            events={events}
            today={today}
            onDayClick={openCreate}
            onEventClick={openDetail}
            onDeleteClick={openDelete}
          />
        </div>
      </div>

      {modal === "detail" && selected && (
        <EventDetailModal
          event={selected}
          onEdit={() => openEdit(selected)}
          onDelete={() => openDelete(selected)}
          onClose={closeModal}
        />
      )}
      {(modal === "create" || modal === "edit") && (
        <EventModal
          event={modal === "edit" ? selected : null}
          defaultDate={defaultDate}
          onClose={closeModal}
        />
      )}
      {modal === "delete" && selected && (
        <DeleteConfirm event={selected} onClose={closeModal} />
      )}
    </>
  );
}
