"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createServiceTemplate,
  updateServiceTemplate,
  deleteServiceTemplate,
  importQbItems,
  type ServiceTemplate,
  type ServiceTemplateState,
} from "@/app/actions";

const inputCls = "border border-slate-200 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000080] w-full bg-white";
const labelCls = "text-slate-500 text-[11px] font-medium uppercase tracking-wider";

function TemplateForm({
  template,
  onCancel,
}: {
  template?: ServiceTemplate;
  onCancel: () => void;
}) {
  const isEdit = !!template;
  const action = isEdit ? updateServiceTemplate : createServiceTemplate;
  const [state, formAction, busy] = useActionState<ServiceTemplateState, FormData>(action, {});
  const [isPerFoot, setIsPerFoot] = useState(template?.is_per_foot ?? false);

  return (
    <form action={formAction} className="flex flex-col gap-4 bg-white border border-slate-200 rounded-sm p-5">
      {isEdit && <input type="hidden" name="id" value={template.id} />}
      <input type="hidden" name="is_per_foot" value={String(isPerFoot)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Service Name</label>
          <input
            name="name"
            required
            defaultValue={template?.name ?? ""}
            placeholder="Bi-Weekly Wash"
            className={inputCls}
          />
          <p className="text-[10px] text-slate-400">Automatically linked (or created) in QuickBooks on save.</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>{isPerFoot ? "Rate ($/ft)" : "Flat Price ($)"}</label>
          <input
            type="number"
            name="default_amount"
            step="0.01"
            min="0"
            required
            defaultValue={template?.default_amount ?? ""}
            placeholder={isPerFoot ? "5.00" : "150.00"}
            className={inputCls}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
        <div
          onClick={() => setIsPerFoot(v => !v)}
          className={`w-8 h-4 rounded-full relative transition-colors ${isPerFoot ? "bg-[#000080]" : "bg-slate-200"}`}
        >
          <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isPerFoot ? "translate-x-4" : "translate-x-0.5"}`} />
        </div>
        <span className="text-xs text-slate-600">Price per foot</span>
      </label>
      {isPerFoot && (
        <p className="text-[10px] text-slate-400 -mt-2">
          When creating a recurring or one-time service via New+, the rate is pre-filled from vessel length automatically.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className={labelCls}>Calendar Notes (optional)</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={template?.description ?? ""}
          placeholder="Access instructions, service details, etc. Pre-fills the Notes field when this template is selected in New+."
          className={`${inputCls} resize-none`}
        />
        <p className="text-[10px] text-slate-400">Paste into the calendar event automatically. You can still edit it per booking.</p>
      </div>

      {state.error && <p className="text-red-600 text-xs">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="bg-[#000080] text-white text-[10px] tracking-widest uppercase font-semibold px-4 py-2 rounded-sm hover:bg-blue-900 transition-colors disabled:opacity-50"
        >
          {busy ? "Saving..." : isEdit ? "Save Changes" : "Add Service"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-500 text-xs hover:text-slate-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ServicesClient({ templates: initial }: { templates: ServiceTemplate[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [syncing, startSync] = useTransition();
  const [syncResult, setSyncResult] = useState<{ imported: number; linked: number; updated: number; error?: string } | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError("");
    const res = await deleteServiceTemplate(id);
    if (res.error) {
      setDeleteError(res.error);
      setDeletingId(null);
    } else {
      setTemplates(t => t.filter(x => x.id !== id));
      setDeletingId(null);
    }
  }

  function handleSync() {
    setSyncResult(null);
    startSync(async () => {
      const res = await importQbItems();
      setSyncResult(res);
      if (!res.error) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-slate-800 text-base font-bold">Recurring Services</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Define reusable service types with default pricing. Pick a template in the New+ flow to pre-fill qty, rate, and description per client.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 border border-slate-300 text-slate-600 text-[10px] tracking-widest uppercase font-semibold px-3 py-2 rounded-sm hover:border-[#000080] hover:text-[#000080] transition-colors disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync with QuickBooks"}
          </button>
          {!showCreate && (
            <button
              onClick={() => { setShowCreate(true); setEditingId(null); }}
              className="flex items-center gap-1.5 bg-[#000080] text-white text-[10px] tracking-widest uppercase font-semibold px-3 py-2 rounded-sm hover:bg-blue-900 transition-colors shrink-0"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Service
            </button>
          )}
        </div>
      </div>

      {syncResult && (
        <p className={`text-xs -mt-3 ${syncResult.error ? "text-red-600" : "text-emerald-600"}`}>
          {syncResult.error ?? `Synced: ${syncResult.imported} imported, ${syncResult.linked} linked, ${syncResult.updated} updated.`}
        </p>
      )}

      {/* Create form */}
      {showCreate && (
        <TemplateForm onCancel={() => setShowCreate(false)} />
      )}

      {/* Template list */}
      {templates.length === 0 && !showCreate ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-sm py-12 text-center">
          <p className="text-slate-400 text-sm">No service templates yet.</p>
          <p className="text-slate-300 text-xs mt-1">Add your first recurring service above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {templates.map(t => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-sm">
              {editingId === t.id ? (
                <div className="p-1">
                  <TemplateForm template={t} onCancel={() => setEditingId(null)} />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-6 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-slate-800 text-sm font-semibold truncate">{t.name}</p>
                        {t.qb_item_id && (
                          <span className="text-[9px] tracking-widest uppercase font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                            Synced
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <p className="text-slate-400 text-xs truncate mt-0.5 max-w-xs">{t.description}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-slate-800 text-sm font-bold">
                        ${Number(t.default_amount).toFixed(2)}{t.is_per_foot ? "/ft" : ""}
                      </p>
                      <p className="text-slate-400 text-[10px] uppercase tracking-widest">
                        {t.is_per_foot ? "Per Foot" : "Flat Rate"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => { setEditingId(t.id); setShowCreate(false); }}
                      className="text-[10px] tracking-widest uppercase font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      className="text-[10px] tracking-widest uppercase font-semibold text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      {deletingId === t.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {deleteError && <p className="text-red-600 text-xs">{deleteError}</p>}

      {/* Info box */}
      <div className="bg-[#000080]/5 border border-[#000080]/15 rounded-sm px-5 py-4">
        <p className="text-[#000080] text-xs font-semibold mb-1">How auto-invoicing works</p>
        <ul className="text-slate-600 text-xs space-y-1 list-disc pl-4">
          <li>Click New+ from the Pipeline or a contact page and choose Recurring Service or One-Time Invoice.</li>
          <li>Pick a service template, then set the exact qty, rate, and discount for that client.</li>
          <li>Choose a frequency: every 1, 2, 4, or 6 weeks. A Google Calendar event is created automatically.</li>
          <li>On the 15th of each month, QB invoices are generated for all scheduled events in the following month.</li>
          <li>Each invoice is logged to the client&apos;s activity timeline automatically.</li>
        </ul>
      </div>
    </div>
  );
}
