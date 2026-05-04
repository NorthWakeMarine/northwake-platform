"use client";

import { useState, useTransition } from "react";
import { importQbCustomers, syncDialpadContacts, runIntegrityCheck, createContactFromQb } from "@/app/actions";

type QbUnmatched = { qbId: string; name: string; email: string | null; phone: string | null };

type SyncResult = {
  qb?: { linked: number; alreadyLinked: number; unmatched: QbUnmatched[]; error?: string };
  dialpad?: { synced: number; error?: string };
  integrity?: { checked: number; flagged: number; error?: string };
  error?: string;
};

export default function SyncPanel({ qbConnected, dialpadConnected }: { qbConnected: boolean; dialpadConnected: boolean }) {
  const [result, setResult] = useState<SyncResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [importingQbId, setImportingQbId] = useState<string | null>(null);
  const [imported, setImported] = useState<Set<string>>(new Set());

  function handleSyncAll() {
    startTransition(async () => {
      const [qb, dialpad, integrity] = await Promise.all([
        qbConnected ? importQbCustomers() : Promise.resolve(undefined),
        dialpadConnected ? syncDialpadContacts() : Promise.resolve(undefined),
        runIntegrityCheck(),
      ]);
      setResult({ qb: qb ?? undefined, dialpad: dialpad ?? undefined, integrity });
    });
  }

  function handleImportContact(u: QbUnmatched) {
    setImportingQbId(u.qbId);
    startTransition(async () => {
      const res = await createContactFromQb(u.qbId, u.name, u.email, u.phone);
      if (res.ok) setImported((prev) => new Set([...prev, u.qbId]));
      setImportingQbId(null);
    });
  }

  const nothingConnected = !qbConnected && !dialpadConnected;

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-800 text-sm font-semibold">Data Sync</h2>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Import contacts from QuickBooks, match Dialpad numbers, and run the integrity check.
          </p>
        </div>
        <button
          onClick={handleSyncAll}
          disabled={isPending || nothingConnected}
          className="bg-[#000080] hover:bg-[#0000a0] text-white text-[10px] tracking-widest uppercase px-5 py-2.5 rounded-sm font-semibold disabled:opacity-40 transition-colors shrink-0"
        >
          {isPending ? "Syncing..." : "Sync All"}
        </button>
      </div>

      {nothingConnected && (
        <p className="text-slate-400 text-xs">Connect QuickBooks or Dialpad above to enable sync.</p>
      )}

      {result && (
        <div className="flex flex-col gap-4 pt-2 border-t border-slate-100">

          {/* QuickBooks results */}
          {result.qb && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-500">QuickBooks</p>
              {result.qb.error ? (
                <p className="text-red-500 text-xs">{result.qb.error}</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 text-xs">{result.qb.linked} newly linked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-slate-500 text-xs">{result.qb.alreadyLinked} already linked</span>
                  </div>
                  {result.qb.unmatched.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-amber-700 text-xs">{result.qb.unmatched.length} QB customers not in CRM</span>
                    </div>
                  )}
                </div>
              )}

              {/* Unmatched QB customers */}
              {(result.qb.unmatched.length > 0) && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <p className="text-[10px] tracking-widest uppercase font-medium text-amber-600">QB Customers Missing from CRM</p>
                  <div className="flex flex-col divide-y divide-slate-100 border border-slate-100 rounded-sm overflow-hidden">
                    {result.qb.unmatched.map((u) => (
                      <div key={u.qbId} className="flex items-center justify-between px-3 py-2 gap-3">
                        <div className="min-w-0">
                          <p className="text-slate-800 text-xs font-medium truncate">{u.name}</p>
                          {u.email && <p className="text-slate-400 text-[10px] truncate">{u.email}</p>}
                        </div>
                        {imported.has(u.qbId) ? (
                          <span className="text-emerald-600 text-[10px] tracking-widest uppercase font-medium shrink-0">Imported</span>
                        ) : (
                          <button
                            onClick={() => handleImportContact(u)}
                            disabled={importingQbId === u.qbId}
                            className="text-[10px] tracking-widest uppercase text-[#000080] hover:text-[#0000a0] font-semibold shrink-0 disabled:opacity-50"
                          >
                            {importingQbId === u.qbId ? "Importing..." : "Import"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dialpad results */}
          {result.dialpad && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-500">Dialpad</p>
              {result.dialpad.error ? (
                <p className="text-red-500 text-xs">{result.dialpad.error}</p>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-700 text-xs">{result.dialpad.synced} contacts matched by phone</span>
                </div>
              )}
            </div>
          )}

          {/* Integrity check results */}
          {result.integrity && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-500">Integrity Check</p>
              {result.integrity.error ? (
                <p className="text-red-500 text-xs">{result.integrity.error}</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-slate-500 text-xs">{result.integrity.checked} contacts checked</span>
                  </div>
                  {result.integrity.flagged > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-amber-700 text-xs">{result.integrity.flagged} moved to Needs Attention</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-emerald-700 text-xs">All contacts clean</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
