"use client";

import { useState, useTransition } from "react";
import { importQbCustomers, importDialpadContacts, runIntegrityCheck, createContactFromQb, createContactFromDialpad, pushCrmToDialpad, updateContactFields, promoteDialpadLocalToCompany, importQbInvoices, syncQbVesselsToContacts } from "@/app/actions";
import type { FieldMismatch, DpUnmatched } from "@/app/actions";

type QbUnmatched = { qbId: string; name: string; email: string | null; phone: string | null; companyName: string | null };

type SyncResult = {
  qb?: { linked: number; alreadyLinked: number; unmatched: QbUnmatched[]; mismatches: FieldMismatch[]; error?: string };
  dialpad?: { fetched: number; linked: number; alreadyLinked: number; unmatched: DpUnmatched[]; mismatches: FieldMismatch[]; error?: string };
  integrity?: { checked: number; flagged: number; error?: string };
  dpPush?: { updated: number; created: number; error?: string };
  dpPromote?: { promoted: number; alreadyShared: number; error?: string };
  qbInvoices?: { imported: number; skipped: number; error?: string };
  qbVessels?: { synced: number; created: number; error?: string };
};

export default function SyncPanel({ qbConnected, dialpadConnected }: { qbConnected: boolean; dialpadConnected: boolean }) {
  const [result, setResult] = useState<SyncResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [importingQbId, setImportingQbId] = useState<string | null>(null);
  const [importingDpId, setImportingDpId] = useState<string | null>(null);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [resolvedMismatches, setResolvedMismatches] = useState<Set<string>>(new Set());

  function handleSyncAll() {
    startTransition(async () => {
      const [qb, qbInvoices, qbVessels, dialpad, integrity] = await Promise.all([
        qbConnected ? importQbCustomers() : Promise.resolve(undefined),
        qbConnected ? importQbInvoices() : Promise.resolve(undefined),
        qbConnected ? syncQbVesselsToContacts() : Promise.resolve(undefined),
        dialpadConnected ? importDialpadContacts() : Promise.resolve(undefined),
        runIntegrityCheck(),
      ]);
      setResult({ qb: qb ?? undefined, qbInvoices: qbInvoices ?? undefined, qbVessels: qbVessels ?? undefined, dialpad: dialpad ?? undefined, integrity });
    });
  }

  function handleImportContact(u: QbUnmatched) {
    setImportingQbId(u.qbId);
    startTransition(async () => {
      const res = await createContactFromQb(u.qbId, u.name, u.email, u.phone, u.companyName);
      if (res.ok) setImported((prev) => new Set([...prev, u.qbId]));
      setImportingQbId(null);
    });
  }

  function handleImportAll(unmatched: QbUnmatched[]) {
    startTransition(async () => {
      for (const u of unmatched) {
        if (imported.has(u.qbId)) continue;
        const res = await createContactFromQb(u.qbId, u.name, u.email, u.phone, u.companyName);
        if (res.ok) setImported((prev) => new Set([...prev, u.qbId]));
      }
    });
  }

  function handleResolveMismatch(m: FieldMismatch) {
    startTransition(async () => {
      const res = await updateContactFields(m.contactId, { [m.field]: m.sourceValue });
      if (res.ok) setResolvedMismatches((prev) => new Set([...prev, `${m.contactId}:${m.field}`]));
    });
  }

  function handleImportDialpadContact(u: DpUnmatched) {
    setImportingDpId(u.dpId);
    startTransition(async () => {
      const res = await createContactFromDialpad(u.dpId, u.name, u.email, u.phone);
      if (res.ok) setImported((prev) => new Set([...prev, `dp:${u.dpId}`]));
      setImportingDpId(null);
    });
  }

  function handleImportAllDialpad(unmatched: DpUnmatched[]) {
    startTransition(async () => {
      for (const u of unmatched) {
        if (imported.has(`dp:${u.dpId}`)) continue;
        const res = await createContactFromDialpad(u.dpId, u.name, u.email, u.phone);
        if (res.ok) setImported((prev) => new Set([...prev, `dp:${u.dpId}`]));
      }
    });
  }

  function handlePushToDialpad() {
    startTransition(async () => {
      const dpPush = await pushCrmToDialpad();
      setResult((prev) => ({ ...prev, dpPush }));
    });
  }

  function handlePromoteLocalToCompany() {
    startTransition(async () => {
      const dpPromote = await promoteDialpadLocalToCompany();
      setResult((prev) => ({ ...prev, dpPromote }));
    });
  }

  const nothingConnected = !qbConnected && !dialpadConnected;

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-slate-800 text-sm font-semibold">Data Sync</h2>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Import contacts from QuickBooks, match Dialpad numbers, and run the integrity check.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dialpadConnected && (
            <>
              <button
                onClick={handlePromoteLocalToCompany}
                disabled={isPending}
                className="border border-slate-200 text-slate-600 hover:border-slate-300 text-[10px] tracking-widest uppercase px-4 py-2.5 rounded-sm font-semibold disabled:opacity-40 transition-colors"
              >
                {isPending ? "Promoting..." : "Promote Local → Shared"}
              </button>
              <button
                onClick={handlePushToDialpad}
                disabled={isPending}
                className="border border-slate-200 text-slate-600 hover:border-slate-300 text-[10px] tracking-widest uppercase px-4 py-2.5 rounded-sm font-semibold disabled:opacity-40 transition-colors"
              >
                {isPending ? "Pushing..." : "Push to Dialpad"}
              </button>
            </>
          )}
          <button
            onClick={handleSyncAll}
            disabled={isPending || nothingConnected}
            className="bg-[#000080] hover:bg-[#0000a0] text-white text-[10px] tracking-widest uppercase px-5 py-2.5 rounded-sm font-semibold disabled:opacity-40 transition-colors"
          >
            {isPending ? "Syncing..." : "Sync All"}
          </button>
        </div>
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
                  {result.qb.mismatches.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      <span className="text-orange-700 text-xs">{result.qb.mismatches.length} field mismatches</span>
                    </div>
                  )}
                </div>
              )}

              {result.qb.mismatches.length > 0 && (
                <MismatchList
                  title="QB Field Mismatches"
                  mismatches={result.qb.mismatches}
                  resolvedMismatches={resolvedMismatches}
                  onResolve={handleResolveMismatch}
                  isPending={isPending}
                  sourceLabel="QB"
                />
              )}

              {result.qb.unmatched.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] tracking-widest uppercase font-medium text-amber-600">QB Customers Missing from CRM</p>
                    {result.qb.unmatched.filter((u) => !imported.has(u.qbId)).length > 0 && (
                      <button
                        onClick={() => handleImportAll(result.qb!.unmatched)}
                        disabled={isPending}
                        className="text-[10px] tracking-widest uppercase text-[#000080] hover:text-[#0000a0] font-semibold disabled:opacity-50"
                      >
                        {isPending ? "Importing..." : `Import All (${result.qb.unmatched.filter((u) => !imported.has(u.qbId)).length})`}
                      </button>
                    )}
                  </div>
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
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-slate-400 text-xs">{result.dialpad.fetched} fetched from Dialpad</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 text-xs">{result.dialpad.linked} newly linked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-slate-500 text-xs">{result.dialpad.alreadyLinked} already linked</span>
                  </div>
                  {result.dialpad.unmatched.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-amber-700 text-xs">{result.dialpad.unmatched.length} Dialpad contacts not in CRM</span>
                    </div>
                  )}
                </div>
              )}

              {result.dialpad.unmatched && result.dialpad.unmatched.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] tracking-widest uppercase font-medium text-amber-600">Dialpad Contacts Missing from CRM</p>
                    {result.dialpad.unmatched.filter((u) => !imported.has(`dp:${u.dpId}`)).length > 0 && (
                      <button
                        onClick={() => handleImportAllDialpad(result.dialpad!.unmatched)}
                        disabled={isPending}
                        className="text-[10px] tracking-widest uppercase text-[#000080] hover:text-[#0000a0] font-semibold disabled:opacity-50"
                      >
                        {isPending ? "Importing..." : `Import All (${result.dialpad.unmatched.filter((u) => !imported.has(`dp:${u.dpId}`)).length})`}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col divide-y divide-slate-100 border border-slate-100 rounded-sm overflow-hidden">
                    {result.dialpad.unmatched.map((u) => (
                      <div key={u.dpId} className="flex items-center justify-between px-3 py-2 gap-3">
                        <div className="min-w-0">
                          <p className="text-slate-800 text-xs font-medium truncate">{u.name}</p>
                          {u.email && <p className="text-slate-400 text-[10px] truncate">{u.email}</p>}
                          {u.phone && <p className="text-slate-400 text-[10px] truncate">{u.phone}</p>}
                        </div>
                        {imported.has(`dp:${u.dpId}`) ? (
                          <span className="text-emerald-600 text-[10px] tracking-widest uppercase font-medium shrink-0">Imported</span>
                        ) : (
                          <button
                            onClick={() => handleImportDialpadContact(u)}
                            disabled={importingDpId === u.dpId}
                            className="text-[10px] tracking-widest uppercase text-[#000080] hover:text-[#0000a0] font-semibold shrink-0 disabled:opacity-50"
                          >
                            {importingDpId === u.dpId ? "Importing..." : "Import"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(result.dialpad.mismatches?.length ?? 0) > 0 && (
                <MismatchList
                  title="Dialpad Field Mismatches"
                  mismatches={result.dialpad.mismatches}
                  resolvedMismatches={resolvedMismatches}
                  onResolve={handleResolveMismatch}
                  isPending={isPending}
                  sourceLabel="Dialpad"
                />
              )}
            </div>
          )}

          {/* QB Vessel Sync results */}
          {result.qbVessels && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-500">QB Fleet Sync</p>
              {result.qbVessels.error ? (
                <p className="text-red-500 text-xs">{result.qbVessels.error}</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 text-xs">{result.qbVessels.created} vessels added</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-slate-700 text-xs">{result.qbVessels.synced} vessels updated</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Invoices results */}
          {result.qbInvoices && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-500">QB Invoice Import</p>
              {result.qbInvoices.error ? (
                <p className="text-red-500 text-xs">{result.qbInvoices.error}</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 text-xs">{result.qbInvoices.imported} invoices added to timelines</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-slate-500 text-xs">{result.qbInvoices.skipped} already imported</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Promote Local → Shared results */}
          {result.dpPromote && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-500">Promote Local to Shared</p>
              {result.dpPromote.error ? (
                <p className="text-red-500 text-xs">{result.dpPromote.error}</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 text-xs">{result.dpPromote.promoted} contacts promoted to shared</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-slate-500 text-xs">{result.dpPromote.alreadyShared} already in shared</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Push to Dialpad results */}
          {result.dpPush && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-500">Push to Dialpad</p>
              {result.dpPush.error ? (
                <p className="text-red-500 text-xs">{result.dpPush.error}</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 text-xs">{result.dpPush.updated} contacts updated in Dialpad</span>
                  </div>
                  {result.dpPush.created > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-slate-700 text-xs">{result.dpPush.created} new contacts created in Dialpad</span>
                    </div>
                  )}
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

function MismatchList({
  title,
  mismatches,
  resolvedMismatches,
  onResolve,
  isPending,
  sourceLabel,
}: {
  title: string;
  mismatches: FieldMismatch[];
  resolvedMismatches: Set<string>;
  onResolve: (m: FieldMismatch) => void;
  isPending: boolean;
  sourceLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <p className="text-[10px] tracking-widest uppercase font-medium text-orange-600">{title}</p>
      <div className="flex flex-col divide-y divide-slate-100 border border-slate-100 rounded-sm overflow-hidden">
        {mismatches.map((m) => {
          const key = `${m.contactId}:${m.field}`;
          const resolved = resolvedMismatches.has(key);
          return (
            <div key={key} className="flex items-start justify-between px-3 py-2 gap-3">
              <div className="min-w-0 flex flex-col gap-0.5">
                <p className="text-slate-800 text-xs font-medium truncate">{m.contactName || "Unknown"}</p>
                <p className="text-[10px] text-slate-400 capitalize">{m.field}: <span className="text-slate-500">{m.crmValue || <span className="italic">empty</span>}</span></p>
                <p className="text-[10px] text-orange-600">{sourceLabel}: {m.sourceValue}</p>
              </div>
              {resolved ? (
                <span className="text-emerald-600 text-[10px] tracking-widest uppercase font-medium shrink-0 mt-0.5">Updated</span>
              ) : (
                <button
                  onClick={() => onResolve(m)}
                  disabled={isPending}
                  className="text-[10px] tracking-widest uppercase text-[#000080] hover:text-[#0000a0] font-semibold shrink-0 disabled:opacity-50 mt-0.5"
                >
                  Use {sourceLabel}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
