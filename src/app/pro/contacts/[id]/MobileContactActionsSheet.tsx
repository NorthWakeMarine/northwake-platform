"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  logManualCall,
  updatePipelineStage,
  syncContactToQuickBooks,
  deleteContact,
} from "@/app/actions";
import { STAGE_LABELS, STAGES, type PipelineStage } from "@/types/pipeline";

interface Props {
  contactId: string;
  qbCustomerId: string | null;
  pipelineStage: PipelineStage | null;
  isVendor: boolean;
}

type ActiveSheet = "log_call" | "pipeline" | "more" | null;

export default function MobileContactActionsSheet({
  contactId,
  qbCustomerId,
  pipelineStage,
  isVendor,
}: Props) {
  const router = useRouter();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  // Log call
  const [direction, setDirection] = useState<"inbound" | "outbound">("outbound");
  const [callNotes, setCallNotes] = useState("");
  const [callError, setCallError] = useState("");
  const [isPendingCall, startCallTransition] = useTransition();

  // Pipeline
  const [stage, setStage] = useState<PipelineStage | null>(pipelineStage);
  const [isPendingPipeline, startPipelineTransition] = useTransition();

  // QB sync (unlinked)
  const [isPendingQb, startQbTransition] = useTransition();
  const [qbResult, setQbResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [linkedId, setLinkedId] = useState(qbCustomerId);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function close() {
    setActiveSheet(null);
    setDeleteConfirm(false);
    setCallError("");
  }

  function handleLogCall() {
    if (!callNotes.trim()) { setCallError("Please add call notes."); return; }
    setCallError("");
    startCallTransition(async () => {
      const res = await logManualCall(contactId, direction, callNotes);
      if (!res.ok) { setCallError(res.error ?? "Failed."); return; }
      setCallNotes("");
      setDirection("outbound");
      close();
      router.refresh();
    });
  }

  function handleStageSelect(s: PipelineStage) {
    close();
    startPipelineTransition(async () => {
      const res = await updatePipelineStage(contactId, "contact", s);
      if (res.ok) { setStage(s); router.refresh(); }
    });
  }

  function handleQbSync() {
    startQbTransition(async () => {
      const res = await syncContactToQuickBooks(contactId);
      setQbResult(res);
      if (res.ok) router.refresh();
    });
  }

  async function handleDelete() {
    setIsDeleting(true);
    const res = await deleteContact(contactId);
    if (!res.error) {
      router.push("/pro/contacts");
    } else {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {/* Fixed bottom bar */}
      <div className="fixed bottom-16 inset-x-0 z-40 md:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-2 safe-area-bottom">
        <div className={`grid gap-2 ${isVendor ? "grid-cols-2" : "grid-cols-2"}`}>
          <button
            onClick={() => setActiveSheet("log_call")}
            className="flex items-center justify-center gap-2 bg-[#000080] text-white text-sm font-semibold rounded-xl h-12"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Log Call
          </button>

          {!isVendor && (
            <button
              onClick={() => setActiveSheet("pipeline")}
              disabled={isPendingPipeline}
              className={`flex items-center justify-center gap-2 rounded-xl h-12 text-sm font-semibold disabled:opacity-50 ${
                stage
                  ? "border border-[#000080]/25 bg-[#000080]/5 text-[#000080]"
                  : "border border-slate-200 text-slate-600"
              }`}
            >
              {stage ? (
                <>
                  <span className="truncate max-w-[100px]">{STAGE_LABELS[stage]}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Pipeline
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveSheet("more")}
            className={`flex items-center justify-center gap-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl h-12 ${isVendor ? "col-span-full" : ""}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
            More
          </button>
        </div>

      </div>

      {/* Backdrop */}
      {activeSheet && (
        <div className="fixed inset-0 bg-black/40 z-[60] md:hidden" onClick={close} />
      )}

      {/* Log Call Sheet */}
      {activeSheet === "log_call" && (
        <div className="fixed bottom-0 inset-x-0 z-[70] md:hidden bg-white rounded-t-2xl px-5 pt-5 pb-8">
          <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-5" />
          <h2 className="text-slate-800 text-base font-semibold mb-4">Log Call</h2>

          <div className="flex gap-2 mb-4">
            {(["outbound", "inbound"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl border transition-colors capitalize ${
                  direction === d
                    ? "bg-[#000080] border-[#000080] text-white"
                    : "border-slate-200 text-slate-500"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <textarea
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            rows={3}
            placeholder="Call summary..."
            autoFocus
            className="w-full border border-slate-200 bg-slate-50 text-slate-800 text-sm px-4 py-3 rounded-xl resize-none focus:outline-none focus:border-[#000080] transition-colors mb-3"
          />

          {callError && <p className="text-red-500 text-sm mb-3">{callError}</p>}

          <div className="flex gap-2">
            <button
              onClick={close}
              className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleLogCall}
              disabled={isPendingCall}
              className="flex-1 h-12 rounded-xl bg-[#000080] text-white text-sm font-semibold disabled:opacity-50"
            >
              {isPendingCall ? "Saving..." : "Save Call"}
            </button>
          </div>
        </div>
      )}

      {/* Pipeline Sheet */}
      {activeSheet === "pipeline" && (
        <div className="fixed bottom-0 inset-x-0 z-[70] md:hidden bg-white rounded-t-2xl">
          <div className="px-5 pt-5 pb-2">
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-5" />
            <h2 className="text-slate-800 text-base font-semibold">Move to Stage</h2>
          </div>
          <div className="pb-10">
            {STAGES.map((s) => (
              <button
                key={s}
                onClick={() => handleStageSelect(s)}
                className={`w-full flex items-center justify-between px-5 py-4 text-sm font-medium border-b border-slate-100 last:border-0 transition-colors ${
                  s === stage
                    ? "bg-[#000080]/5 text-[#000080]"
                    : "text-slate-700 active:bg-slate-50"
                }`}
              >
                <span>{STAGE_LABELS[s]}</span>
                {s === stage && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* More Sheet */}
      {activeSheet === "more" && (
        <div className="fixed bottom-0 inset-x-0 z-[70] md:hidden bg-white rounded-t-2xl px-5 pt-5 pb-10">
          <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-5" />

          <div className="flex flex-col gap-3">
            {!isVendor && (
              linkedId ? (
                <a
                  href={`https://app.qbo.intuit.com/app/customerdetail?nameId=${linkedId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  className="flex items-center justify-between h-13 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium py-3.5"
                >
                  View in QuickBooks
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              ) : (
                <button
                  onClick={handleQbSync}
                  disabled={isPendingQb}
                  className="flex items-center justify-center h-12 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium disabled:opacity-50"
                >
                  {qbResult?.ok ? "Synced to QB" : isPendingQb ? "Syncing..." : "Sync to QuickBooks"}
                </button>
              )
            )}

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center justify-center h-12 rounded-xl border border-red-100 text-red-500 text-sm font-medium"
              >
                Delete Contact
              </button>
            ) : (
              <div className="border border-red-200 rounded-xl px-4 py-4">
                <p className="text-red-700 text-sm font-medium mb-3 text-center">Delete this contact? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
