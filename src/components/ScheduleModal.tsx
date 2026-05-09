"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { syncAppointmentToGoogle, type CalendarSyncState } from "@/app/actions";

const inputCls =
  "border border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000080] w-full";

interface ScheduleModalProps {
  card: {
    contactId: string;
    contactName: string;
    vesselName: string | null;
  } | null;
  onClose: () => void;
}

export default function ScheduleModal({ card, onClose }: ScheduleModalProps) {
  const [state, action, busy] = useActionState<CalendarSyncState, FormData>(
    syncAppointmentToGoogle,
    {}
  );
  const [isAllDay, setIsAllDay] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  useEffect(() => {
    if (!card) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [card, onClose]);

  if (!card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Schedule appointment">
      <div ref={dialogRef} className="bg-white rounded-sm shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-slate-800 text-sm font-semibold">Schedule Appointment</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {card.contactName}{card.vesselName ? ` · ${card.vesselName}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form action={action} className="px-6 py-5 flex flex-col gap-4">
          <input type="hidden" name="contact_id" value={card.contactId} />
          <input type="hidden" name="contact_name" value={card.contactName} />
          <input type="hidden" name="vessel_name" value={card.vesselName ?? ""} />

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">
              Service
            </label>
            <input
              name="service"
              required
              placeholder="e.g. Full Detail, Bottom Paint"
              className={inputCls}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={isAllDay}
              onClick={() => setIsAllDay((v) => !v)}
              className={`w-8 h-4 rounded-full relative transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#000080] focus-visible:ring-offset-1 ${isAllDay ? "bg-[#000080]" : "bg-slate-200"}`}
            >
              <span
                className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isAllDay ? "translate-x-4" : "translate-x-0.5"}`}
              />
              <span className="sr-only">All day</span>
            </button>
            <span className="text-slate-500 text-xs select-none" onClick={() => setIsAllDay((v) => !v)}>
              All day
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">
                Start
              </label>
              <input
                type={isAllDay ? "date" : "datetime-local"}
                name="start_time"
                required
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">
                End
              </label>
              <input
                type={isAllDay ? "date" : "datetime-local"}
                name="end_time"
                required
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">
              Location
            </label>
            <input
              name="location"
              placeholder="Marina slip, address, etc."
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">
              Access Info
            </label>
            <input
              name="access_info"
              placeholder="Gate code, dock number, etc."
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">
              Service Notes
            </label>
            <textarea
              name="service_notes"
              rows={3}
              placeholder="Special instructions, materials needed, etc."
              className={`${inputCls} resize-none`}
            />
          </div>

          {state.error && <p className="text-red-600 text-xs">{state.error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 bg-[#000080] text-white text-xs font-semibold py-2.5 rounded-sm hover:bg-blue-900 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy && (
                <svg aria-hidden="true" className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {busy ? "Scheduling..." : "Add to Calendar"}
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
