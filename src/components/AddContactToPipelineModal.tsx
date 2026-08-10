"use client";

import { useState, useTransition, useEffect } from "react";
import { searchContactsByName, updatePipelineStage } from "@/app/actions";
import { STAGE_LABELS, type PipelineStage } from "@/types/pipeline";

const STAGE_ORDER: PipelineStage[] = [
  "new_leads", "discovery", "estimate_sent",
  "needs_attention", "work_scheduled", "done_invoiced",
];

type ContactResult = { id: string; name: string; email: string | null; address: string | null };

export default function AddContactToPipelineModal({ onClose, onAdded }: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactResult[]>([]);
  const [picked, setPicked] = useState<ContactResult | null>(null);
  const [searching, startSearch] = useTransition();
  const [saving, startSave] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    if (picked || query.trim().length < 2) return;
    const t = setTimeout(() => {
      startSearch(async () => {
        setResults(await searchContactsByName(query));
      });
    }, 250);
    return () => clearTimeout(t);
  }, [query, picked]);

  function handleAddToStage(stage: PipelineStage) {
    if (!picked) return;
    setError("");
    startSave(async () => {
      const res = await updatePipelineStage(picked.id, stage);
      if (!res.ok) { setError(res.error ?? "Failed to add to pipeline."); return; }
      onAdded();
      onClose();
    });
  }

  const inputCls = "border border-gray-500 rounded-sm px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-navy w-full bg-white";
  const labelCls = "text-[10px] font-medium text-gray-700 tracking-widest uppercase";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-xl sm:rounded-md shadow-xl w-full sm:max-w-md flex flex-col max-h-[90dvh]">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-slate-800 text-sm font-bold">Add Contact to Pipeline</h2>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3 overflow-y-auto">
          {!picked ? (
            <div className="relative">
              <label className={labelCls}>Search Contact</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contact name..."
                className={`${inputCls} mt-1`}
                autoFocus
              />
              {searching && <span className="absolute right-3 top-9 text-[10px] text-slate-400">searching...</span>}
              {results.length > 0 && (
                <div className="mt-1 bg-white border border-slate-200 rounded-sm shadow-lg overflow-hidden">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setPicked(r)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                    >
                      <p className="text-xs font-medium text-slate-800">{r.name}</p>
                      {r.email && <p className="text-[10px] text-slate-400">{r.email}</p>}
                    </button>
                  ))}
                </div>
              )}
              {query.trim().length >= 2 && !searching && results.length === 0 && (
                <p className="text-[11px] text-slate-400 mt-2">No contacts found.</p>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-sm px-3 py-2">
                <span className="text-xs font-medium text-slate-800">{picked.name}</span>
                <button onClick={() => { setPicked(null); setQuery(""); }} className="text-slate-400 hover:text-slate-600 text-xs ml-2">
                  Change
                </button>
              </div>

              <label className={labelCls}>Pipeline Stage</label>
              <div className="flex flex-col gap-1.5">
                {STAGE_ORDER.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => handleAddToStage(stage)}
                    disabled={saving}
                    className="w-full text-left px-3 py-2.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-sm hover:border-[#000080] hover:text-[#000080] transition-colors disabled:opacity-50"
                  >
                    {saving ? "Adding..." : STAGE_LABELS[stage]}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
      </div>
    </div>
  );
}
