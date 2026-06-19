"use client";

import { useActionState, useEffect, useRef, useState, startTransition, useTransition } from "react";
import {
  addVesselService, markServiced, deleteVesselService, updateVesselService,
  unlinkCalendarEvent,
  type VesselServiceState,
  type VesselRecurringLink,
} from "@/app/actions";
import { serviceHealth, type VesselService } from "@/app/pro/contacts/[id]/FleetGallery";

const INTERVAL_OPTIONS = [
  { label: "Every month",    days: 30  },
  { label: "Every 2 months", days: 60  },
  { label: "Every 3 months", days: 90  },
  { label: "Every 4 months", days: 120 },
  { label: "Every 6 months", days: 180 },
  { label: "Every year",     days: 365 },
];

function intervalLabel(days: number): string {
  const match = INTERVAL_OPTIONS.find((o) => o.days === days);
  return match ? match.label : `Every ${days} days`;
}

const SERVICE_SUGGESTIONS = [
  "Full Detail", "Exterior Wash", "Wax / Sealant", "Bottom Paint",
  "Engine Service", "Isinglass Treatment", "Teak Restoration", "One-Off Wash",
];

function NotificationsToggle({ defaultValue }: { defaultValue: boolean }) {
  const [on, setOn] = useState(defaultValue);
  return (
    <div className="flex items-center gap-2">
      <input type="hidden" name="notifications_enabled" value={String(on)} />
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-[#000080]" : "bg-slate-200"}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-1"}`} />
      </button>
      <span className="text-xs text-slate-500">Reminders {on ? "on" : "off"}</span>
    </div>
  );
}

function ServiceScheduleSection({
  vesselId,
  contactId,
  initialServices,
}: {
  vesselId: string;
  contactId: string | null;
  initialServices: VesselService[];
}) {
  const [services, setServices] = useState<VesselService[]>(initialServices);
  const [addState, addAction, isAdding]   = useActionState<VesselServiceState, FormData>(addVesselService, {});
  const [markState, markAction, isMarking] = useActionState<VesselServiceState, FormData>(markServiced, {});
  const [delState, delAction, isDeleting]  = useActionState<VesselServiceState, FormData>(deleteVesselService, {});
  const [editState, editAction, isEditing] = useActionState<VesselServiceState, FormData>(updateVesselService, {});
  const addRef    = useRef<HTMLFormElement>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (addState.success) {
      addRef.current?.reset();
      startTransition(() => setShowAdd(false));
    }
  }, [addState.success]);

  useEffect(() => {
    if (editState.success) startTransition(() => setEditingId(null));
  }, [editState.success]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Service Schedule</p>
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="text-[9px] tracking-widest uppercase text-[#000080] font-semibold hover:text-[#0000a0] transition-colors"
          >
            + Add Service
          </button>
        )}
      </div>

      {services.length === 0 && !showAdd && (
        <p className="text-slate-400 text-xs">No service schedules yet.</p>
      )}

      {services.map((s) => {
        const h = serviceHealth(s.last_service_date, s.interval_days ?? undefined);
        const notifOn = s.notifications_enabled !== false;
        const isEditingThis = editingId === s.id;

        if (isEditingThis) {
          return (
            <form key={s.id} action={editAction} className="bg-white border border-slate-200 rounded-sm p-3 flex flex-col gap-2">
              <input type="hidden" name="service_id"  value={s.id} />
              <input type="hidden" name="contact_id"  value={contactId ?? ""} />
              <div className="flex flex-col gap-1">
                <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Service</label>
                <input name="service_name" list="edit-svc-suggestions" required defaultValue={s.service_name ?? ""}
                  className="border border-slate-200 rounded-sm px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400" />
                <datalist id="edit-svc-suggestions">
                  {SERVICE_SUGGESTIONS.map((sg) => <option key={sg} value={sg} />)}
                </datalist>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Interval</label>
                <select name="interval_days" defaultValue={s.interval_days ?? 90}
                  className="border border-slate-200 rounded-sm px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400 bg-white">
                  {INTERVAL_OPTIONS.map((o) => <option key={o.days} value={o.days}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Typical Price ($)</label>
                <input type="number" name="typical_price" step="0.01" min="0"
                  placeholder="0.00" defaultValue={s.typical_price ?? ""}
                  className="border border-slate-200 rounded-sm px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400" />
              </div>
              <NotificationsToggle defaultValue={notifOn} />
              {editState.error && <p className="text-red-500 text-[11px]">{editState.error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={isEditing}
                  className="bg-[#000080] text-white text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-sm font-semibold disabled:opacity-50">
                  {isEditing ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={() => setEditingId(null)}
                  className="text-slate-400 text-xs hover:text-slate-600">Cancel</button>
              </div>
            </form>
          );
        }

        return (
          <div key={s.id} className="bg-white border border-slate-100 rounded-sm p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">{s.service_name}</span>
              <div className="flex items-center gap-2.5">
                <span className={`text-[9px] ${notifOn ? "text-[#000080]" : "text-slate-300"}`}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill={notifOn ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </span>
                <span className="text-[9px] text-slate-400">{intervalLabel(s.interval_days ?? 90)}</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${h.barColor}`} style={{ width: `${h.barWidth}%` }} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-medium ${h.textCls}`}>{h.label}</span>
              <div className="flex items-center gap-3">
                <form action={markAction}>
                  <input type="hidden" name="service_id" value={s.id} />
                  <input type="hidden" name="contact_id" value={contactId ?? ""} />
                  <button type="submit" disabled={isMarking}
                    className="text-[9px] tracking-widest uppercase text-emerald-600 font-semibold hover:text-emerald-800 disabled:opacity-50">
                    Mark Done
                  </button>
                </form>
                <button type="button" onClick={() => setEditingId(s.id)}
                  className="text-[9px] tracking-widest uppercase text-slate-400 hover:text-slate-700 font-semibold">
                  Edit
                </button>
                <form action={delAction} onSubmit={() => setServices((prev) => prev.filter((x) => x.id !== s.id))}>
                  <input type="hidden" name="service_id" value={s.id} />
                  <input type="hidden" name="contact_id" value={contactId ?? ""} />
                  <button type="submit" disabled={isDeleting}
                    className="text-[9px] tracking-widest uppercase text-red-400 hover:text-red-600 disabled:opacity-50">
                    Remove
                  </button>
                </form>
              </div>
            </div>
            {s.last_service_date && (
              <p className="text-[10px] text-slate-400">
                Last: {new Date(s.last_service_date + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
            {s.typical_price != null && (
              <p className="text-[10px] text-slate-400">Typical: ${Number(s.typical_price).toFixed(2)}</p>
            )}
          </div>
        );
      })}

      {showAdd && (
        <form ref={addRef} action={addAction} className="bg-white border border-slate-200 rounded-sm p-3 flex flex-col gap-2">
          <input type="hidden" name="vessel_id"  value={vesselId} />
          <input type="hidden" name="contact_id" value={contactId ?? ""} />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Service</label>
            <input name="service_name" list="add-svc-suggestions" required placeholder="e.g. Full Detail"
              className="border border-slate-200 rounded-sm px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400" />
            <datalist id="add-svc-suggestions">
              {SERVICE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Interval</label>
              <select name="interval_days" defaultValue="90"
                className="border border-slate-200 rounded-sm px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400 bg-white">
                {INTERVAL_OPTIONS.map((o) => <option key={o.days} value={o.days}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Typical Price ($)</label>
              <input type="number" name="typical_price" step="0.01" min="0" placeholder="0.00"
                className="border border-slate-200 rounded-sm px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Last Done</label>
              <input type="date" name="last_service_date"
                className="border border-slate-200 rounded-sm px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400" />
            </div>
          </div>
          {addState.error && <p className="text-red-500 text-[11px]">{addState.error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isAdding}
              className="bg-[#000080] text-white text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-sm font-semibold disabled:opacity-50">
              {isAdding ? "Saving..." : "Add"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="text-slate-400 text-xs hover:text-slate-600">Cancel</button>
          </div>
        </form>
      )}
      {(markState.error || delState.error) && (
        <p className="text-red-500 text-[11px]">{markState.error ?? delState.error}</p>
      )}
    </div>
  );
}

function RecurringServicesSection({ initialLinks }: { initialLinks: VesselRecurringLink[] }) {
  const [links, setLinks]         = useState<VesselRecurringLink[]>(initialLinks);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  async function handleUnlink(gcalEventId: string) {
    setUnlinking(gcalEventId);
    await unlinkCalendarEvent(gcalEventId);
    setLinks((prev) => prev.filter((l) => l.gcal_event_id !== gcalEventId));
    setConfirmId(null);
    setUnlinking(null);
  }

  if (links.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Recurring Services</p>
        <a href="/pro/calendar" className="text-[9px] tracking-widest uppercase text-[#000080] font-semibold hover:text-[#0000a0] transition-colors">
          Manage in Calendar
        </a>
      </div>
      <div className="flex flex-col gap-2">
        {links.map((link) => {
          const gross = link.invoice_rate != null
            ? link.invoice_rate * (link.invoice_qty ?? 1)
            : (link.invoice_amount ?? 0);
          const disc  = link.invoice_discount ?? 0;
          const net   = Math.max(0, gross - disc);
          const isConfirming = confirmId === link.gcal_event_id;
          const isBusy       = unlinking === link.gcal_event_id;
          return (
            <div key={link.gcal_event_id} className="bg-white border border-slate-100 rounded-sm px-3 py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {link.service_label ?? "Recurring Service"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {link.auto_invoice ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-[10px] text-emerald-700 font-medium">Auto-invoice</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Manual billing</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {gross > 0 && (
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">${net.toFixed(2)}/mo</p>
                    {disc > 0 && (
                      <p className="text-[9px] text-slate-400 line-through">${gross.toFixed(2)}</p>
                    )}
                  </div>
                )}
                {isConfirming ? (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleUnlink(link.gcal_event_id)} disabled={isBusy}
                      className="text-[9px] tracking-widest uppercase font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors">
                      {isBusy ? "..." : "Confirm"}
                    </button>
                    <button onClick={() => setConfirmId(null)}
                      className="text-[9px] tracking-widest uppercase font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmId(link.gcal_event_id)}
                    className="text-[9px] tracking-widest uppercase font-semibold text-slate-300 hover:text-red-400 transition-colors"
                    title="Remove this service link">
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function VesselDetailClient({
  vesselId,
  contactId,
  initialServices,
  initialRecurring,
}: {
  vesselId: string;
  contactId: string | null;
  initialServices: VesselService[];
  initialRecurring: VesselRecurringLink[];
}) {
  return (
    <>
      <ServiceScheduleSection
        vesselId={vesselId}
        contactId={contactId}
        initialServices={initialServices}
      />
      <RecurringServicesSection initialLinks={initialRecurring} />
    </>
  );
}
