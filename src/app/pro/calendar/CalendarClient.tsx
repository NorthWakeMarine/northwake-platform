"use client";

import { useActionState, useState, useEffect } from "react";
import {
  createStandaloneEvent,
  updateStandaloneEvent,
  deleteStandaloneEvent,
  type CalendarEventState,
} from "@/app/actions";
import type { CalendarEvent } from "@/lib/google-calendar";

// ── Google Calendar color map ──────────────────────────────────────────────────

const GCAL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "1":  { bg: "#EEF0FB", text: "#3949AB", border: "#7986CB" }, // Lavender
  "2":  { bg: "#E6F4EA", text: "#1B7F40", border: "#33B679" }, // Sage
  "3":  { bg: "#F5E6FB", text: "#6A1B99", border: "#8E24AA" }, // Grape
  "4":  { bg: "#FCE8E6", text: "#C0392B", border: "#E67C73" }, // Flamingo
  "5":  { bg: "#FEF9E0", text: "#B37C00", border: "#F6BF26" }, // Banana
  "6":  { bg: "#FDE9E0", text: "#C0392B", border: "#F4511E" }, // Tangerine
  "7":  { bg: "#E3F5FD", text: "#0277BD", border: "#039BE5" }, // Peacock
  "8":  { bg: "#F1F1F1", text: "#424242", border: "#616161" }, // Graphite
  "9":  { bg: "#E8EAF6", text: "#283593", border: "#3F51B5" }, // Blueberry
  "10": { bg: "#E6F4EA", text: "#0B5E30", border: "#0B8043" }, // Basil
  "11": { bg: "#FCE8E6", text: "#B71C1C", border: "#D50000" }, // Tomato
};
const DEFAULT_COLOR = { bg: "#000080", text: "#fff", border: "#000060" };

function getEventColor(colorId?: string) {
  if (!colorId) return DEFAULT_COLOR;
  return GCAL_COLORS[colorId] ?? DEFAULT_COLOR;
}

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

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function eventStartDay(ev: CalendarEvent): Date {
  if (!ev.start.includes("T")) {
    const [y, m, d] = ev.start.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const dt = new Date(ev.start);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function eventEndDay(ev: CalendarEvent): Date {
  if (!ev.end.includes("T")) {
    // Google all-day end is exclusive (next day) — subtract 1
    const [y, m, d] = ev.end.split("-").map(Number);
    const excl = new Date(y, m - 1, d);
    excl.setDate(excl.getDate() - 1);
    return excl;
  }
  const dt = new Date(ev.end);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
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

function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
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

// Google all-day end dates are exclusive (day after last day). Subtract 1 for display.
function allDayEndDisplay(isoEnd: string): string {
  const [y, m, d] = isoEnd.split("-").map(Number);
  const date = new Date(y, m - 1, d - 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

// ── Month grid layout ──────────────────────────────────────────────────────────

type EventSegment = {
  event: CalendarEvent;
  weekIndex: number;
  colStart: number;
  colSpan: number;
  isStart: boolean;
  isEnd: boolean;
  slotRow: number;
};

function buildMonthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const startSunday = new Date(firstDay);
  startSunday.setDate(firstDay.getDate() - firstDay.getDay());

  const weeks: Date[][] = [];
  const current = new Date(startSunday);
  while (weeks.length < 6) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (weeks.length >= 5 && current.getMonth() !== month) break;
  }
  return weeks;
}

function computeSegments(events: CalendarEvent[], weeks: Date[][]): EventSegment[] {
  const segments: EventSegment[] = [];

  const sorted = [...events].sort((a, b) => {
    const aLen = daysBetween(eventStartDay(a), eventEndDay(a));
    const bLen = daysBetween(eventStartDay(b), eventEndDay(b));
    if (bLen !== aLen) return bLen - aLen;
    return eventStartDay(a).getTime() - eventStartDay(b).getTime();
  });

  for (const ev of sorted) {
    const evStart = eventStartDay(ev);
    const evEnd   = eventEndDay(ev);

    for (let wi = 0; wi < weeks.length; wi++) {
      const weekStart = weeks[wi][0];
      const weekEnd   = weeks[wi][6];

      if (evEnd < weekStart || evStart > weekEnd) continue;

      const segStart = evStart < weekStart ? weekStart : evStart;
      const segEnd   = evEnd   > weekEnd   ? weekEnd   : evEnd;

      const colStart = segStart.getDay();
      const colSpan  = daysBetween(segStart, segEnd) + 1;

      const takenSlots = segments
        .filter(s => s.weekIndex === wi)
        .filter(s => s.colStart < colStart + colSpan && s.colStart + s.colSpan > colStart)
        .map(s => s.slotRow);

      let slotRow = 0;
      while (takenSlots.includes(slotRow)) slotRow++;

      segments.push({
        event: ev,
        weekIndex: wi,
        colStart,
        colSpan,
        isStart: evStart >= weekStart,
        isEnd:   evEnd   <= weekEnd,
        slotRow,
      });
    }
  }

  return segments;
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
  const color = getEventColor(event.colorId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-sm shadow-2xl w-full sm:max-w-lg flex flex-col max-h-[90dvh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="min-w-0 flex items-start gap-2.5">
            <span className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: color.border }} />
            <div>
              <h2 className="text-slate-900 text-base font-bold leading-snug">{event.title}</h2>
              <p className="text-slate-500 text-xs mt-1">{dateStr} &middot; {timeStr}</p>
              {event.location && (
                <p className="text-slate-400 text-xs mt-0.5">{event.location}</p>
              )}
            </div>
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
  const [isAllDay, setIsAllDay] = useState(event ? !event.start.includes("T") : false);
  const [createState, createAction, creating] = useActionState<CalendarEventState, FormData>(createStandaloneEvent, {});
  const [updateState, updateAction, updating] = useActionState<CalendarEventState, FormData>(updateStandaloneEvent, {});

  const state  = isEdit ? updateState : createState;
  const action = isEdit ? updateAction : createAction;
  const busy   = isEdit ? updating    : creating;

  useEffect(() => { if (state.success) onClose(); }, [state.success, onClose]);

  const inputCls = "border border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000080] w-full";

  const defaultStart = event
    ? (isAllDay && !event.start.includes("T") ? event.start : toLocalDateTimeInput(event.start))
    : (defaultDate ? defaultDate.split("T")[0] : "");
  const defaultEnd = event
    ? (isAllDay && !event.end.includes("T") ? allDayEndDisplay(event.end) : toLocalDateTimeInput(event.end))
    : (defaultDate ? defaultDate.split("T")[0] : "");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-sm shadow-2xl w-full sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-slate-800 text-sm font-semibold">{isEdit ? "Edit Event" : "New Event"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <form action={action} className="px-6 py-5 flex flex-col gap-4">
          {isEdit && <input type="hidden" name="event_id" value={event.id} />}
          <input type="hidden" name="is_all_day" value={isAllDay ? "true" : "false"} />

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Title</label>
            <input name="title" required defaultValue={event?.title ?? ""}
              placeholder="e.g. Wash + Wax"
              className={inputCls} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
            <div
              onClick={() => setIsAllDay(v => !v)}
              className={`w-8 h-4 rounded-full relative transition-colors ${isAllDay ? "bg-[#000080]" : "bg-slate-200"}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isAllDay ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-slate-500 text-xs">All day</span>
          </label>

          {isAllDay ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Start Date</label>
                <input type="date" name="start_time" required defaultValue={defaultStart} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">End Date</label>
                <input type="date" name="end_time" required defaultValue={defaultEnd} className={inputCls} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Start</label>
                <input type="datetime-local" name="start_time" required
                  defaultValue={event && !event.start.includes("T") ? "" : (event ? toLocalDateTimeInput(event.start) : defaultDate ?? "")}
                  className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">End</label>
                <input type="datetime-local" name="end_time" required
                  defaultValue={event && !event.end.includes("T") ? "" : (event ? toLocalDateTimeInput(event.end) : defaultDate ?? "")}
                  className={inputCls} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Location</label>
            <input name="location" defaultValue={event?.location ?? ""}
              placeholder="Marina slip, address, etc."
              className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Notes</label>
            <textarea name="description" rows={4} defaultValue={event?.description ? htmlToPlainText(event.description) : ""}
              placeholder="Service details, access info, etc."
              className={`${inputCls} resize-none`} />
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-sm shadow-2xl w-full sm:max-w-sm p-6 flex flex-col gap-4">
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

// ── Month Grid ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HEADER_H = 52;   // px — height of the date-number row per week band
const EVENT_H  = 22;   // px — height of each event banner
const EVENT_GAP = 2;   // px — gap between banner rows
const MAX_SLOTS = 3;   // visible event rows before "+N more"

function MonthGrid({ monthDate, events, today, onDayClick, onEventClick, onDeleteClick }: {
  monthDate: Date;
  events: CalendarEvent[];
  today: Date;
  onDayClick: (iso: string) => void;
  onEventClick: (e: CalendarEvent) => void;
  onDeleteClick: (e: CalendarEvent) => void;
}) {
  const year  = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const weeks = buildMonthGrid(year, month);
  const segments = computeSegments(events, weeks);

  return (
    <div className="flex flex-col border border-slate-200 rounded-sm overflow-hidden bg-white flex-1">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {DAY_LABELS.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold tracking-widest uppercase text-slate-400">
            {d}
          </div>
        ))}
      </div>

      {/* Week bands */}
      {weeks.map((week, wi) => {
        const weekSegs = segments.filter(s => s.weekIndex === wi);
        const maxSlot  = weekSegs.reduce((m, s) => Math.max(m, s.slotRow), -1);
        const bandHeight = HEADER_H + (Math.min(maxSlot + 1, MAX_SLOTS)) * (EVENT_H + EVENT_GAP) + 10;

        // Compute overflow per day: how many segs exceed MAX_SLOTS for that column
        const overflowByCol: number[] = Array(7).fill(0);
        weekSegs.forEach(s => {
          if (s.slotRow >= MAX_SLOTS) {
            for (let c = s.colStart; c < s.colStart + s.colSpan; c++) {
              overflowByCol[c] = (overflowByCol[c] ?? 0) + 1;
            }
          }
        });

        return (
          <div
            key={wi}
            className="relative border-b border-slate-100 last:border-b-0"
            style={{ minHeight: bandHeight }}
          >
            {/* Date number cells */}
            <div className="grid grid-cols-7 h-full absolute inset-0 pointer-events-none">
              {week.map((day, di) => {
                const isToday     = isSameDay(day, today);
                const isThisMonth = day.getMonth() === month;
                return (
                  <div
                    key={di}
                    className={`border-r border-slate-100 last:border-r-0 ${isThisMonth ? "" : "bg-slate-50/60"}`}
                  />
                );
              })}
            </div>

            {/* Clickable date headers */}
            <div className="grid grid-cols-7 relative z-10">
              {week.map((day, di) => {
                const isToday     = isSameDay(day, today);
                const isThisMonth = day.getMonth() === month;
                const overflow    = overflowByCol[di] ?? 0;
                const p = (n: number) => String(n).padStart(2, "0");
                const isoPrefix   = `${day.getFullYear()}-${p(day.getMonth() + 1)}-${p(day.getDate())}`;

                return (
                  <div
                    key={di}
                    className="flex flex-col items-center pt-1.5 pb-0.5 cursor-pointer hover:bg-slate-50/80 transition-colors"
                    style={{ height: HEADER_H }}
                    onClick={() => onDayClick(`${isoPrefix}T09:00`)}
                  >
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isToday
                        ? "bg-[#000080] text-white"
                        : isThisMonth
                          ? "text-slate-700 hover:bg-slate-100"
                          : "text-slate-300"
                    }`}>
                      {day.getDate()}
                    </div>
                    {overflow > 0 && (
                      <span className="text-[9px] text-slate-400 font-medium mt-auto mb-1">
                        +{overflow} more
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Event banners — absolutely positioned over the band */}
            {weekSegs
              .filter(s => s.slotRow < MAX_SLOTS)
              .map((seg, si) => {
                const color = getEventColor(seg.event.colorId);
                const isAllDay = !seg.event.start.includes("T");
                const timeLabel = isAllDay ? null : fmtTime(seg.event.start);
                const isMultiDay = seg.colSpan > 1 || !seg.isStart || !seg.isEnd;

                return (
                  <div
                    key={`${seg.event.id}-${wi}-${si}`}
                    className="absolute cursor-pointer group"
                    style={{
                      top:    HEADER_H + seg.slotRow * (EVENT_H + EVENT_GAP),
                      left:   `calc(${seg.colStart} / 7 * 100% + 2px)`,
                      width:  `calc(${seg.colSpan} / 7 * 100% - 4px)`,
                      height: EVENT_H,
                      borderRadius: isMultiDay
                        ? `${seg.isStart ? "4px" : "0"} ${seg.isEnd ? "4px" : "0"} ${seg.isEnd ? "4px" : "0"} ${seg.isStart ? "4px" : "0"}`
                        : "4px",
                      backgroundColor: isAllDay || isMultiDay ? color.border : color.bg,
                      borderLeft:  isMultiDay && !seg.isStart ? "none" : `1px solid ${color.border}`,
                      borderRight: isMultiDay && !seg.isEnd   ? "none" : `1px solid ${color.border}`,
                      borderTop:    `1px solid ${color.border}`,
                      borderBottom: `1px solid ${color.border}`,
                      zIndex: 10,
                    }}
                    onClick={(e) => { e.stopPropagation(); onEventClick(seg.event); }}
                  >
                    <div
                      className="flex items-center gap-1 px-1.5 h-full overflow-hidden"
                      style={{ color: isAllDay || isMultiDay ? "#fff" : color.text }}
                    >
                      {seg.isStart && (
                        <>
                          <span className="text-[11px] font-semibold truncate leading-none">{seg.event.title}</span>
                          {timeLabel && !isMultiDay && (
                            <span className="text-[10px] opacity-70 shrink-0">{timeLabel}</span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Delete button on hover */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteClick(seg.event); }}
                      className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-white/80 hover:text-white transition-opacity text-xs leading-none w-4 h-4 flex items-center justify-center"
                      title="Delete"
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}

// ── Week Grid ──────────────────────────────────────────────────────────────────

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
        const isToday  = isSameDay(day, today);
        const dayEvents = events.filter(ev => {
          const evS = eventStartDay(ev);
          const evE = eventEndDay(ev);
          return evS <= day && day <= evE;
        });
        const dateLabel  = day.getDate();
        const monthLabel = day.toLocaleDateString("en-US", { month: "short" });

        return (
          <div key={i} className="flex flex-col min-h-0">
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

            <div className="flex-1 p-1.5 flex flex-col gap-1 overflow-y-auto">
              {dayEvents.map(ev => {
                const color = getEventColor(ev.colorId);
                return (
                  <div
                    key={ev.id}
                    className="group relative rounded-sm px-2 py-1.5 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: color.bg,
                      border: `1px solid ${color.border}`,
                    }}
                    onClick={() => onEventClick(ev)}
                  >
                    <p className="text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: color.text }}>
                      {ev.title}
                    </p>
                    <p className="text-[10px] mt-0.5 opacity-70" style={{ color: color.text }}>{fmtTime(ev.start)}</p>
                    {ev.location && (
                      <p className="text-[9px] truncate mt-0.5 opacity-60" style={{ color: color.text }}>{ev.location}</p>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteClick(ev); }}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all text-xs leading-none w-4 h-4 flex items-center justify-center"
                      title="Delete"
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Client ────────────────────────────────────────────────────────────────

type ViewMode = "month" | "week";

export default function CalendarClient({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewMode,   setViewMode]   = useState<ViewMode>("month");
  const [monthDate,  setMonthDate]  = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [weekStart,  setWeekStart]  = useState(() => startOfWeek(today));
  const [modal,      setModal]      = useState<"create" | "detail" | "edit" | "delete" | null>(null);
  const [selected,   setSelected]   = useState<CalendarEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  function prevPeriod() {
    if (viewMode === "month") setMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    else setWeekStart(d => addDays(d, -7));
  }
  function nextPeriod() {
    if (viewMode === "month") setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    else setWeekStart(d => addDays(d, 7));
  }
  function goToday() {
    setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setWeekStart(startOfWeek(today));
  }

  function openCreate(iso?: string) { setDefaultDate(iso); setSelected(null); setModal("create"); }
  function openDetail(ev: CalendarEvent) { setSelected(ev); setModal("detail"); }
  function openEdit(ev: CalendarEvent)   { setSelected(ev); setModal("edit"); }
  function openDelete(ev: CalendarEvent) { setSelected(ev); setModal("delete"); }
  function closeModal() { setModal(null); setSelected(null); setDefaultDate(undefined); }

  const isCurrentPeriod = viewMode === "month"
    ? monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() === today.getMonth()
    : isSameDay(weekStart, startOfWeek(today));

  const headerLabel = viewMode === "month"
    ? fmtMonthYear(monthDate)
    : fmtWeekRange(weekStart);

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0">

        {/* Header */}
        <div className="bg-[#eceef1] border-b border-[#dcdee3] px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button onClick={prevPeriod}
                className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button onClick={nextPeriod}
                className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <div>
              <h1 className="text-[#1E2938] text-base font-bold tracking-tight">{headerLabel}</h1>
              <p className="text-[#1E2938]/50 text-sm mt-0.5">Calendar</p>
            </div>

            {!isCurrentPeriod && (
              <button onClick={goToday}
                className="text-[10px] tracking-widest uppercase text-[#000080] font-semibold border border-[#000080]/30 px-2.5 py-1 rounded-sm hover:bg-[#000080]/5 transition-colors">
                Today
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex border border-slate-200 rounded-sm overflow-hidden">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-2 text-[10px] tracking-widest uppercase font-semibold transition-colors ${viewMode === "month" ? "bg-[#000080] text-white" : "text-slate-500 hover:text-slate-800 bg-white"}`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-2 text-[10px] tracking-widest uppercase font-semibold transition-colors ${viewMode === "week" ? "bg-[#000080] text-white" : "text-slate-500 hover:text-slate-800 bg-white"}`}
              >
                Week
              </button>
            </div>

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
              Google Cal
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

        {/* Grid */}
        <div className="flex-1 px-6 py-4 min-h-0 overflow-auto flex flex-col">
          {viewMode === "month" ? (
            <MonthGrid
              monthDate={monthDate}
              events={events}
              today={today}
              onDayClick={openCreate}
              onEventClick={openDetail}
              onDeleteClick={openDelete}
            />
          ) : (
            <WeekGrid
              weekStart={weekStart}
              events={events}
              today={today}
              onDayClick={openCreate}
              onEventClick={openDetail}
              onDeleteClick={openDelete}
            />
          )}
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
