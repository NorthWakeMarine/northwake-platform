"use client";

import { useActionState, useEffect, useRef, useState, startTransition, useTransition } from "react";
import {
  addAsset, updateAssetNotes, type AssetState,
  addVesselService, markServiced, deleteVesselService, type VesselServiceState,
  createQuickBooksInvoiceDraft,
} from "@/app/actions";

export type VesselService = {
  id: string;
  vessel_id: string;
  service_name: string;
  interval_days: number;
  last_service_date: string | null;
};

export type Asset = {
  id: string;
  asset_type: string | null;
  name: string | null;
  make_model: string | null;
  year: number | null;
  color: string | null;
  length_ft: string | null;
  location: string | null;
  registration: string | null;
  notes: string | null;
  last_service_date: string | null;
  vessel_type: string | null;
  service_interval_days: number | null;
};

const INTERVAL_OPTIONS = [
  { label: "Every month",    days: 30  },
  { label: "Every 2 months", days: 60  },
  { label: "Every 3 months", days: 90  },
  { label: "Every 4 months", days: 120 },
  { label: "Every 6 months", days: 180 },
  { label: "Every year",     days: 365 },
];

function intervalLabel(days: number): string {
  const match = INTERVAL_OPTIONS.find(o => o.days === days);
  return match ? match.label : `Every ${days} days`;
}

export function serviceHealth(lastServiceDate: string | null, intervalDays = 90): {
  label: string;
  barColor: string;
  textCls: string;
  barWidth: number;
} {
  if (!lastServiceDate) {
    return { label: "No service record", barColor: "bg-slate-200", textCls: "text-slate-400", barWidth: 0 };
  }
  const warnAt = Math.round(intervalDays * 0.9); // warn at 90% of interval
  const maxAt  = Math.round(intervalDays * 1.2); // red zone starts at 120%
  const days   = Math.floor((Date.now() - new Date(lastServiceDate).getTime()) / 86400000);
  const barWidth = Math.max(0, Math.round(((maxAt - days) / maxAt) * 100));

  if (days < warnAt) return { label: `${days}d since service`,  barColor: "bg-emerald-500", textCls: "text-emerald-700", barWidth };
  if (days < maxAt)  return { label: `Due soon (${days}d)`,     barColor: "bg-amber-400",   textCls: "text-amber-700",   barWidth };
  return                    { label: `Overdue (${days}d)`,       barColor: "bg-red-500",     textCls: "text-red-700",     barWidth: Math.max(4, barWidth) };
}

const typeConfig: Record<string, { label: string; iconCls: string; badgeCls: string; icon: React.ReactNode }> = {
  vessel: {
    label: "Vessel",
    iconCls: "bg-blue-50 text-blue-600",
    badgeCls: "bg-blue-50 text-blue-700 border border-blue-200",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l1.5-9L12 3l7.5 5L21 17" /><path d="M21 17H3l3 4h12l3-4z" />
        <path d="M12 3v14" />
      </svg>
    ),
  },
  car: {
    label: "Car",
    iconCls: "bg-slate-100 text-slate-600",
    badgeCls: "bg-slate-100 text-slate-600 border border-slate-200",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14l4 4v4a2 2 0 0 1-2 2h-2" />
        <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
  plane: {
    label: "Aircraft",
    iconCls: "bg-purple-50 text-purple-600",
    badgeCls: "bg-purple-50 text-purple-700 border border-purple-200",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 20 4s-2 1-3.5 2.5L9 8.2 2.8 6l-1 1 6 4-3 3-4-1-1 1 3 3 3 3 1-1-1-4 3-3 4 6 1-1-2.2-6.2z" />
      </svg>
    ),
  },
  other: {
    label: "Other",
    iconCls: "bg-amber-50 text-amber-600",
    badgeCls: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
};

function AddAssetForm({ contactId, onDone }: { contactId: string; onDone: () => void }) {
  const [state, action, isPending] = useActionState<AssetState, FormData>(addAsset, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [assetType, setAssetType] = useState<string>("vessel");

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      startTransition(() => setAssetType("vessel"));
      onDone();
    }
  }, [state.success, onDone]);

  const types = ["vessel", "car", "plane", "other"] as const;

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <input type="hidden" name="contact_id" value={contactId} />
      <input type="hidden" name="asset_type" value={assetType} />

      {state.error && <p className="text-red-500 text-[11px]">{state.error}</p>}

      {/* Type selector */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Asset Type</p>
        <div className="flex gap-2">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setAssetType(t)}
              className={`flex-1 py-2 text-xs font-medium rounded-sm border transition-colors capitalize ${
                assetType === t
                  ? "bg-[#000080] border-[#000080] text-white"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {t === "plane" ? "Aircraft" : t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Name / Nickname</label>
          <input
            type="text"
            name="name"
            placeholder={assetType === "vessel" ? "Sea Breeze" : assetType === "car" ? "Black G-Wagon" : assetType === "plane" ? "N123AB" : "Asset name"}
            className="border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Make / Model</label>
          <input
            type="text"
            name="make_model"
            placeholder={assetType === "vessel" ? "Sea Ray 350 SLX" : assetType === "car" ? "Mercedes G63" : assetType === "plane" ? "Cessna 172" : "Make / model"}
            className="border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Year</label>
          <input
            type="number"
            name="year"
            placeholder="2022"
            min="1900"
            max="2099"
            className="border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Color</label>
          <input
            type="text"
            name="color"
            placeholder="White / Navy"
            className="border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400"
          />
        </div>
        {assetType === "vessel" && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Length (ft)</label>
            <input
              type="text"
              name="length_ft"
              placeholder="35"
              className="border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400"
            />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">
            {assetType === "vessel" ? "Registration / Doc #" : assetType === "car" ? "VIN / Plate" : assetType === "plane" ? "Tail Number" : "Registration"}
          </label>
          <input
            type="text"
            name="registration"
            placeholder={assetType === "vessel" ? "FL1234AB" : assetType === "car" ? "ABC-1234" : "N123AB"}
            className="border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400"
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Storage Location</label>
          <input
            type="text"
            name="location"
            placeholder={assetType === "vessel" ? "Ortega River Marina, Slip 14" : assetType === "plane" ? "Signature Flight Support, JAX" : "Storage location"}
            className="border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400"
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Service Interval</label>
          <select
            name="service_interval_days"
            defaultValue="90"
            className="border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-slate-400 bg-white"
          >
            {INTERVAL_OPTIONS.map((o) => (
              <option key={o.days} value={o.days}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Notes</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="e.g. Ceramic coating warranty through 2028"
            className="border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <button type="button" onClick={onDone} className="text-slate-400 hover:text-slate-600 text-xs transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="bg-[#000080] hover:bg-[#0000a0] text-white text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {isPending ? "Saving..." : "Add Asset"}
        </button>
      </div>
    </form>
  );
}

function ServiceScheduleSection({ asset, contactId, services }: {
  asset: Asset; contactId: string; services: VesselService[];
}) {
  const [addState, addAction, isAdding] = useActionState<VesselServiceState, FormData>(addVesselService, {});
  const [markState, markAction, isMarking] = useActionState<VesselServiceState, FormData>(markServiced, {});
  const [delState, delAction, isDeleting] = useActionState<VesselServiceState, FormData>(deleteVesselService, {});
  const addRef = useRef<HTMLFormElement>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { if (addState.success) { addRef.current?.reset(); startTransition(() => setShowAdd(false)); } }, [addState.success]);

  const SERVICE_SUGGESTIONS = ["Full Detail", "Exterior Wash", "Wax / Sealant", "Bottom Paint", "Engine Service", "Isinglass Treatment", "Teak Restoration", "One-Off Wash"];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Service Schedule</p>
        {!showAdd && (
          <button type="button" onClick={() => setShowAdd(true)}
            className="text-[9px] tracking-widest uppercase text-[#000080] font-semibold hover:text-[#0000a0]">
            + Add Service
          </button>
        )}
      </div>

      {services.length === 0 && !showAdd && (
        <p className="text-slate-400 text-xs">No service schedules yet.</p>
      )}

      {services.map((s) => {
        const h = serviceHealth(s.last_service_date, s.interval_days);
        return (
          <div key={s.id} className="border border-slate-100 rounded-sm p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">{s.service_name}</span>
              <span className="text-[9px] text-slate-400">{intervalLabel(s.interval_days)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${h.barColor}`} style={{ width: `${h.barWidth}%` }} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-medium ${h.textCls}`}>{h.label}</span>
              <div className="flex items-center gap-3">
                <form action={markAction}>
                  <input type="hidden" name="service_id" value={s.id} />
                  <input type="hidden" name="contact_id" value={contactId} />
                  <button type="submit" disabled={isMarking}
                    className="text-[9px] tracking-widest uppercase text-emerald-600 font-semibold hover:text-emerald-800 disabled:opacity-50">
                    Mark Done
                  </button>
                </form>
                <form action={delAction}>
                  <input type="hidden" name="service_id" value={s.id} />
                  <input type="hidden" name="contact_id" value={contactId} />
                  <button type="submit" disabled={isDeleting}
                    className="text-[9px] tracking-widest uppercase text-red-400 hover:text-red-600 disabled:opacity-50">
                    Remove
                  </button>
                </form>
              </div>
            </div>
            {s.last_service_date && (
              <p className="text-[10px] text-slate-400">Last: {new Date(s.last_service_date + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            )}
          </div>
        );
      })}

      {showAdd && (
        <form ref={addRef} action={addAction} className="border border-slate-200 rounded-sm p-3 flex flex-col gap-2">
          <input type="hidden" name="vessel_id" value={asset.id} />
          <input type="hidden" name="contact_id" value={contactId} />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Service</label>
            <input name="service_name" list="service-suggestions" required placeholder="e.g. Full Detail"
              className="border border-slate-200 rounded-sm px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400" />
            <datalist id="service-suggestions">
              {SERVICE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
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

function AssetModal({ asset, contactId, services, onClose }: {
  asset: Asset; contactId: string; services: VesselService[]; onClose: () => void;
}) {
  const [notesState, notesAction, isSaving] = useActionState<AssetState, FormData>(updateAssetNotes, {});
  const [invoicePending, startInvoiceTransition] = useTransition();
  const [invoiceResult, setInvoiceResult] = useState<{ invoiceUrl?: string; docNumber?: string; error?: string } | null>(null);
  const cfg = typeConfig[asset.asset_type ?? "vessel"] ?? typeConfig.other;
  const displayName = asset.name || asset.make_model || `${cfg.label} Asset`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-sm border border-slate-200 shadow-xl max-w-lg w-full flex flex-col max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${cfg.iconCls}`}>
              {cfg.icon}
            </div>
            <div>
              <h2 className="text-slate-900 text-sm font-bold">{displayName}</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {[asset.make_model, asset.year?.toString()].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors ml-4 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
            {[
              { label: "Type",         value: cfg.label },
              { label: "Color",        value: asset.color },
              { label: "Length",       value: asset.length_ft ? `${asset.length_ft} ft` : null },
              { label: "Registration", value: asset.registration },
              { label: "Location",     value: asset.location },
            ]
              .filter((f) => f.value)
              .map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-[10px] tracking-widest uppercase font-medium text-slate-400">{label}</dt>
                  <dd className="text-slate-700">{value}</dd>
                </div>
              ))}
          </dl>

          <ServiceScheduleSection asset={asset} contactId={contactId} services={services} />

          <div className="flex flex-col gap-2">
            <p className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Notes</p>
            <form action={notesAction}>
              <input type="hidden" name="asset_id"   value={asset.id} />
              <input type="hidden" name="contact_id" value={contactId} />
              <textarea
                name="notes"
                defaultValue={asset.notes ?? ""}
                rows={4}
                placeholder="e.g. Ceramic coating warranty through 2028. Gate code 4821."
                className="w-full border border-slate-200 rounded-sm px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-none"
              />
              {notesState.error   && <p className="text-red-500 text-[11px] mt-1">{notesState.error}</p>}
              {notesState.success && <p className="text-emerald-600 text-[11px] mt-1">Saved.</p>}
              <button
                type="submit"
                disabled={isSaving}
                className="mt-2 bg-[#000080] hover:bg-[#0000a0] text-white text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {isSaving ? "Saving..." : "Save Notes"}
              </button>
            </form>
          </div>

          {/* Generate Invoice */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <p className="text-[10px] tracking-widest uppercase font-medium text-slate-400">QuickBooks</p>
            {invoiceResult?.invoiceUrl ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-emerald-600 text-xs font-medium">Draft invoice created.</p>
                <a
                  href={invoiceResult.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] tracking-widest uppercase text-[#000080] underline font-medium"
                >
                  Open Invoice #{invoiceResult.docNumber} in QuickBooks
                </a>
              </div>
            ) : (
              <>
                {invoiceResult?.error && (
                  <p className="text-red-500 text-[10px]">{invoiceResult.error}</p>
                )}
                <button
                  type="button"
                  disabled={invoicePending}
                  onClick={() => {
                    startInvoiceTransition(async () => {
                      const res = await createQuickBooksInvoiceDraft(contactId, asset.id);
                      setInvoiceResult(res);
                    });
                  }}
                  className="border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm font-medium transition-colors disabled:opacity-50"
                >
                  {invoicePending ? "Creating..." : "Generate Draft Invoice"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FleetGallery({
  contactId,
  assets,
  vesselServices,
}: {
  contactId: string;
  assets: Asset[];
  vesselServices: VesselService[];
}) {
  const [showAddForm, setShowAddForm]     = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  return (
    <div className="bg-white border border-slate-200 rounded-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-slate-800 text-sm font-semibold">Fleet</h3>
          <p className="text-slate-400 text-[11px] mt-0.5">
            {assets.length} {assets.length === 1 ? "asset" : "assets"} on file
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-[#000080] hover:text-[#0000a0] font-semibold transition-colors border border-[#000080]/20 hover:border-[#000080]/40 px-3 py-1.5 rounded-sm"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Asset
          </button>
        )}
      </div>

      <div className="p-6">
        {showAddForm && (
          <div className="mb-6 pb-6 border-b border-slate-100">
            <p className="text-slate-700 text-xs font-semibold mb-4">New Asset</p>
            <AddAssetForm contactId={contactId} onDone={() => setShowAddForm(false)} />
          </div>
        )}

        {assets.length === 0 && !showAddForm ? (
          <p className="text-slate-400 text-sm text-center py-3">
            No assets on file. Add a vessel, car, or aircraft above.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assets.map((asset) => {
              const cfg = typeConfig[asset.asset_type ?? "vessel"] ?? typeConfig.other;
              const assetServices = vesselServices.filter(s => s.vessel_id === asset.id);
              // Show the most urgent service on the card, fall back to vessel-wide
              const health = assetServices.length > 0
                ? assetServices
                    .map(s => serviceHealth(s.last_service_date, s.interval_days))
                    .sort((a, b) => a.barWidth - b.barWidth)[0]
                : serviceHealth(asset.last_service_date, asset.service_interval_days ?? 90);
              return (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className="text-left border border-slate-200 rounded-sm p-4 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col gap-2.5 group"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${cfg.iconCls}`}>
                      {cfg.icon}
                    </div>
                    <p className="text-slate-800 text-xs font-semibold leading-snug truncate flex-1 min-w-0">
                      {asset.name || asset.make_model || `${cfg.label} Asset`}
                    </p>
                  </div>
                  <div className="min-w-0">
                    {asset.make_model && asset.name && (
                      <p className="text-slate-400 text-[11px] truncate">{asset.make_model}</p>
                    )}
                    {(asset.year || asset.color) && (
                      <p className="text-slate-400 text-[11px]">
                        {[asset.year, asset.color].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {asset.location && (
                      <p className="text-slate-400 text-[11px] truncate mt-0.5">{asset.location}</p>
                    )}
                  </div>
                  {/* Maintenance health bar */}
                  <div className="flex flex-col gap-1 w-full">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${health.barColor}`}
                        style={{ width: `${health.barWidth}%` }}
                      />
                    </div>
                    <p className={`text-[9px] font-medium ${health.textCls}`}>{health.label}</p>
                  </div>
                  <p className="text-[9px] tracking-widest uppercase text-slate-300 font-medium group-hover:text-blue-400 transition-colors">
                    View Details
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          contactId={contactId}
          services={vesselServices.filter(s => s.vessel_id === selectedAsset.id)}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
