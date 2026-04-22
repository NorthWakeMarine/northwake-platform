"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addAsset, updateAssetNotes, type AssetState } from "@/app/actions";

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
};

function serviceStatus(lastServiceDate: string | null) {
  if (!lastServiceDate) return { label: "No service record", cls: "bg-slate-100 text-slate-400 border border-slate-200" };
  const days = Math.floor((Date.now() - new Date(lastServiceDate).getTime()) / 86400000);
  if (days < 30) return { label: `Serviced ${days}d ago`, cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
  if (days < 60) return { label: `Due soon · ${days}d`, cls: "bg-amber-50 text-amber-700 border border-amber-200" };
  return { label: `Overdue · ${days}d`, cls: "bg-red-50 text-red-700 border border-red-200" };
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
      setAssetType("vessel");
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

function AssetModal({ asset, contactId, onClose }: { asset: Asset; contactId: string; onClose: () => void }) {
  const [notesState, notesAction, isSaving] = useActionState<AssetState, FormData>(updateAssetNotes, {});
  const cfg = typeConfig[asset.asset_type ?? "vessel"] ?? typeConfig.other;
  const svc = serviceStatus(asset.last_service_date);
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
          <span className={`text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-sm font-semibold self-start ${svc.cls}`}>
            {svc.label}
          </span>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
            {[
              { label: "Type",         value: cfg.label },
              { label: "Color",        value: asset.color },
              { label: "Length",       value: asset.length_ft ? `${asset.length_ft} ft` : null },
              { label: "Registration", value: asset.registration },
              { label: "Location",     value: asset.location },
              { label: "Last Service", value: asset.last_service_date },
            ]
              .filter((f) => f.value)
              .map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-[10px] tracking-widest uppercase font-medium text-slate-400">{label}</dt>
                  <dd className="text-slate-700">{value}</dd>
                </div>
              ))}
          </dl>

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
        </div>
      </div>
    </div>
  );
}

export default function FleetGallery({
  contactId,
  assets,
}: {
  contactId: string;
  assets: Asset[];
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
              const svc = serviceStatus(asset.last_service_date);
              return (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className="text-left border border-slate-200 rounded-sm p-4 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col gap-2.5 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${cfg.iconCls}`}>
                      {cfg.icon}
                    </div>
                    <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium whitespace-nowrap ${svc.cls}`}>
                      {svc.label}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-800 text-xs font-semibold leading-snug truncate">
                      {asset.name || asset.make_model || `${cfg.label} Asset`}
                    </p>
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
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
