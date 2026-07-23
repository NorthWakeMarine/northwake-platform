"use client";

import { useState, useTransition } from "react";
import { importQbCustomers, runIntegrityCheck, createContactFromQb, createContactFromQuo, pushCrmToQuickBooks, pushCrmToQuo, importQuoContacts, syncVesselsToQbNotes, updateContactFields, pushCrmFieldToQb, importQbInvoices, reconcileQbInvoices, purgeGhostVessels, importQbItems } from "@/app/actions";
import type { FieldMismatch, OpUnmatched } from "@/app/actions";

type QbUnmatched = { qbId: string; name: string; email: string | null; phone: string | null; companyName: string | null };

type SyncResult = {
  qb?: { linked: number; alreadyLinked: number; unmatched: QbUnmatched[]; mismatches: FieldMismatch[]; error?: string };
  quo?: { fetched: number; linked: number; alreadyLinked: number; unmatched: OpUnmatched[]; error?: string };
  quoPush?: { updated: number; created: number; error?: string };
  integrity?: { checked: number; flagged: number; error?: string };
  qbInvoices?: { imported: number; skipped: number; error?: string };
  qbReconcile?: { removed: number; updated: number; error?: string };
  qbPush?: { upserted: number; skipped: string[]; error?: string };
  qbNotes?: { synced: number; error?: string };
  ghostPurge?: { deleted: number; error?: string };
  qbItems?: { imported: number; linked: number; updated: number; error?: string };
};

export default function SyncPanel({ qbConnected, quoConnected }: { qbConnected: boolean; quoConnected: boolean }) {
  const [result, setResult] = useState<SyncResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [importingQbId, setImportingQbId] = useState<string | null>(null);
  const [importingOpId, setImportingOpId] = useState<string | null>(null);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [resolvedMismatches, setResolvedMismatches] = useState<Set<string>>(new Set());
  function handleSyncAll() {
    startTransition(async () => {
      // Purge ghost vessels first so syncVesselsToQbNotes reads a clean DB
      const ghostPurge = await purgeGhostVessels();

      // QB sync + integrity check run in parallel
      // Quo contact sync removed — handled in real-time by Quo webhooks
      // Integrity check fires async so it doesn't hold up the response
      const [qb, qbInvoices, qbReconcile, qbPush, qbNotes, qbItems] = await Promise.all([
        qbConnected ? importQbCustomers() : Promise.resolve(undefined),
        qbConnected ? importQbInvoices() : Promise.resolve(undefined),
        qbConnected ? reconcileQbInvoices() : Promise.resolve(undefined),
        qbConnected ? pushCrmToQuickBooks() : Promise.resolve(undefined),
        qbConnected ? syncVesselsToQbNotes() : Promise.resolve(undefined),
        qbConnected ? importQbItems() : Promise.resolve(undefined),
      ]);

      // Fire integrity check without awaiting it — runs in background
      runIntegrityCheck().catch(() => {});

      setResult({
        qb: qb ?? undefined,
        qbInvoices: qbInvoices ?? undefined,
        qbReconcile: qbReconcile ?? undefined,
        qbPush: qbPush ?? undefined,
        qbNotes: qbNotes ?? undefined,
        qbItems: qbItems ?? undefined,
        ghostPurge,
      });
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

  function handleUseQb(m: FieldMismatch) {
    startTransition(async () => {
      const res = await updateContactFields(m.contactId, { [m.field]: m.sourceValue });
      if (res.ok) setResolvedMismatches((prev) => new Set([...prev, `${m.contactId}:${m.field}`]));
    });
  }

  function handleUseCrm(m: FieldMismatch) {
    startTransition(async () => {
      const res = await pushCrmFieldToQb(m.contactId, m.field);
      if (res.ok) setResolvedMismatches((prev) => new Set([...prev, `${m.contactId}:${m.field}`]));
    });
  }

  function handleImportQuoContact(u: OpUnmatched) {
    setImportingOpId(u.opId);
    startTransition(async () => {
      const res = await createContactFromQuo(u.opId, u.name, u.phone, u.email, u.company);
      if (res.ok) setImported((prev) => new Set([...prev, `op:${u.opId}`]));
      setImportingOpId(null);
    });
  }

  function handleImportAllQuo(unmatched: OpUnmatched[]) {
    startTransition(async () => {
      for (const u of unmatched) {
        if (imported.has(`op:${u.opId}`)) continue;
        const res = await createContactFromQuo(u.opId, u.name, u.phone, u.email, u.company);
        if (res.ok) setImported((prev) => new Set([...prev, `op:${u.opId}`]));
      }
    });
  }

  const nothingConnected = !qbConnected && !quoConnected;

  return (
    <div className="bg-[#F1F2F5] neu-card rounded-md p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-slate-800 text-sm font-semibold">Data Sync</h2>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Import contacts from QuickBooks, match Quo contacts, and run the integrity check.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
        <p className="text-slate-400 text-xs">Connect QuickBooks or Quo above to enable sync.</p>
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
                  onUseQb={handleUseQb}
                  onUseCrm={handleUseCrm}
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


          {/* Invoice reconcile results */}
          {result.qbReconcile && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-500">QB Invoice Reconcile</p>
              {result.qbReconcile.error ? (
                <p className="text-red-500 text-xs">{result.qbReconcile.error}</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-slate-700 text-xs">{result.qbReconcile.removed} stale entries removed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-slate-700 text-xs">{result.qbReconcile.updated} statuses updated</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Push to QB results */}
          {result.qbPush && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-500">CRM to QuickBooks</p>
              {result.qbPush.error ? (
                <p className="text-red-500 text-xs">{result.qbPush.error}</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 text-xs">{result.qbPush.upserted} customers confirmed in QuickBooks</span>
                  </div>
                  {result.qbPush.skipped?.length > 0 && (
                    <div className="flex items-start gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                      <span className="text-amber-700 text-xs">
                        {result.qbPush.skipped.length} skipped (name conflicts with a QB vendor or employee): {result.qbPush.skipped.join(", ")}. Rename the vendor in QuickBooks to link.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* QB vessel notes sync results */}
          {result.qbNotes && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-500">QB Vessel Notes</p>
              {result.qbNotes.error ? (
                <p className="text-red-500 text-xs">{result.qbNotes.error}</p>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-700 text-xs">{result.qbNotes.synced} QB customer notes updated with vessel data</span>
                </div>
              )}
            </div>
          )}


          {/* QB Products/Services sync results */}
          {result.qbItems && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-500">QB Products/Services</p>
              {result.qbItems.error ? (
                <p className="text-red-500 text-xs">{result.qbItems.error}</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 text-xs">{result.qbItems.imported} imported</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-slate-700 text-xs">{result.qbItems.linked} linked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-slate-500 text-xs">{result.qbItems.updated} updated</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quo import results */}
          {result.quo && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-500">Quo</p>
              {result.quo.error ? (
                <p className="text-red-500 text-xs">{result.quo.error}</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-slate-400 text-xs">{result.quo.fetched} fetched from Quo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 text-xs">{result.quo.linked} newly linked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-slate-500 text-xs">{result.quo.alreadyLinked} already linked</span>
                  </div>
                  {result.quo.unmatched.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-amber-700 text-xs">{result.quo.unmatched.filter((u) => !imported.has(`op:${u.opId}`)).length} Quo contacts not in CRM</span>
                    </div>
                  )}
                </div>
              )}
              {result.quo.unmatched && result.quo.unmatched.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-[10px] tracking-widest uppercase font-semibold text-amber-600">Quo Contacts Missing From CRM</p>
                  {result.quo.unmatched.filter((u) => !imported.has(`op:${u.opId}`)).length > 0 && (
                    <button
                      onClick={() => handleImportAllQuo(result.quo!.unmatched)}
                      disabled={isPending}
                      className="self-end text-[10px] tracking-widest uppercase font-semibold text-[#000080] hover:underline disabled:opacity-40"
                    >
                      {isPending ? "Importing..." : `Import All (${result.quo.unmatched.filter((u) => !imported.has(`op:${u.opId}`)).length})`}
                    </button>
                  )}
                  {result.quo.unmatched.map((u) => (
                    <div key={u.opId} className={`flex items-center justify-between gap-3 py-1.5 border-b border-slate-50 ${imported.has(`op:${u.opId}`) ? "opacity-40" : ""}`}>
                      <div>
                        <p className="text-slate-700 text-xs font-medium">{u.name}</p>
                        <p className="text-slate-400 text-[10px]">{u.phone ?? u.email ?? "No contact info"}</p>
                      </div>
                      <button
                        onClick={() => handleImportQuoContact(u)}
                        disabled={importingOpId === u.opId || imported.has(`op:${u.opId}`)}
                        className="text-[10px] tracking-widest uppercase font-semibold text-[#000080] hover:underline disabled:opacity-40 shrink-0"
                      >
                        {imported.has(`op:${u.opId}`) ? "Imported" : importingOpId === u.opId ? "Importing..." : "Import"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quo push results */}
          {result.quoPush && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-500">Push to Quo</p>
              {result.quoPush.error ? (
                <p className="text-red-500 text-xs">{result.quoPush.error}</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 text-xs">{result.quoPush.updated} contacts updated in Quo</span>
                  </div>
                  {result.quoPush.created > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-slate-700 text-xs">{result.quoPush.created} new contacts created in Quo</span>
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
  onUseQb,
  onUseCrm,
  isPending,
  sourceLabel,
}: {
  title: string;
  mismatches: FieldMismatch[];
  resolvedMismatches: Set<string>;
  onUseQb: (m: FieldMismatch) => void;
  onUseCrm: (m: FieldMismatch) => void;
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
                <div className="flex items-center gap-3 shrink-0 mt-0.5">
                  <button
                    onClick={() => onUseCrm(m)}
                    disabled={isPending}
                    className="text-[10px] tracking-widest uppercase text-[#000080] hover:text-[#0000a0] font-semibold disabled:opacity-50"
                  >
                    Use CRM
                  </button>
                  <button
                    onClick={() => onUseQb(m)}
                    disabled={isPending}
                    className="text-[10px] tracking-widest uppercase text-slate-400 hover:text-slate-600 font-medium disabled:opacity-50"
                  >
                    Use {sourceLabel}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
