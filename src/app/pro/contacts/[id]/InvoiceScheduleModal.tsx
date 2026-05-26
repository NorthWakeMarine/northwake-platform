"use client";

import { useActionState, useEffect, useState } from "react";
import { scheduleJobFromInvoice, type ScheduleJobState } from "@/app/actions";

export function InvoiceScheduleModal({
  contactId,
  contactName,
  qbInvoiceId,
  docNumber,
  onClose,
}: {
  contactId: string;
  contactName: string | null;
  qbInvoiceId: string;
  docNumber: string | null;
  onClose: () => void;
}) {
  const [state, action, busy] = useActionState<ScheduleJobState, FormData>(scheduleJobFromInvoice, {});
  const [isAllDay, setIsAllDay] = useState(false);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  const defaultTitle = docNumber
    ? `Job${contactName ? ` — ${contactName}` : ""} (Invoice #${docNumber})`
    : `Job${contactName ? ` — ${contactName}` : ""}`;

  const inputCls = "border border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000080] w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-sm shadow-2xl w-full sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-slate-800 text-sm font-semibold">Schedule Job</h2>
            {docNumber && (
              <p className="text-slate-400 text-xs mt-0.5">Invoice #{docNumber}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>

        <form action={action} className="px-6 py-5 flex flex-col gap-4">
          <input type="hidden" name="contact_id"    value={contactId} />
          <input type="hidden" name="contact_name"  value={contactName ?? ""} />
          <input type="hidden" name="qb_invoice_id" value={qbInvoiceId} />
          <input type="hidden" name="doc_number"    value={docNumber ?? ""} />
          <input type="hidden" name="is_all_day"    value={isAllDay ? "true" : "false"} />

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Title</label>
            <input
              name="title"
              required
              defaultValue={defaultTitle}
              className={inputCls}
            />
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
                <input type="date" name="start_time" required className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">End Date</label>
                <input type="date" name="end_time" required className={inputCls} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Start</label>
                <input type="datetime-local" name="start_time" required className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">End</label>
                <input type="datetime-local" name="end_time" required className={inputCls} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Location</label>
            <input
              name="location"
              placeholder="Marina slip, address, etc."
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Notes</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Access info, service details, etc."
              className={`${inputCls} resize-none`}
            />
          </div>

          {state.error && <p className="text-red-600 text-xs">{state.error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 bg-[#000080] text-white text-xs font-semibold py-2.5 rounded-sm hover:bg-blue-900 transition-colors disabled:opacity-50"
            >
              {busy ? "Scheduling..." : "Schedule Job"}
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
