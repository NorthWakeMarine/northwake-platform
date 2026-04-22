"use client";

import { useActionState, useTransition, useRef, useState } from "react";
import {
  checkDuplicateContact,
  convertLead,
  mergeLead,
  type ConvertLeadState,
  type MergeLeadState,
} from "@/app/actions";

type DuplicateContact = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

type Stage = "idle" | "checking" | "modal";

export default function ConvertButton({ leadId }: { leadId: string }) {
  const [stage, setStage]         = useState<Stage>("idle");
  const [duplicate, setDuplicate] = useState<DuplicateContact | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [, startTransition]       = useTransition();

  const convertFormRef = useRef<HTMLFormElement>(null);

  const [convertState, convertAction, isConverting] = useActionState<ConvertLeadState, FormData>(convertLead, {});
  const [mergeState,   mergeAction,   isMerging]    = useActionState<MergeLeadState,   FormData>(mergeLead,   {});

  const handleConvertClick = () => {
    setCheckError(null);
    setStage("checking");
    startTransition(async () => {
      const result = await checkDuplicateContact(leadId);
      if (result.error) {
        setCheckError(result.error);
        setStage("idle");
        return;
      }
      if (result.found && result.contact) {
        setDuplicate(result.contact);
        setStage("modal");
      } else {
        // No duplicate — submit convert form directly
        convertFormRef.current?.requestSubmit();
      }
    });
  };

  const isWorking = stage === "checking" || isConverting || isMerging;

  return (
    <>
      {/* Hidden convert form — submitted programmatically when no duplicate found */}
      <form ref={convertFormRef} action={convertAction} className="hidden">
        <input type="hidden" name="lead_id"      value={leadId} />
        <input type="hidden" name="force_create" value="false"  />
      </form>

      {/* Primary button */}
      {stage !== "modal" && (
        <div className="flex flex-col items-end gap-1">
          {(checkError || convertState.error) && (
            <p className="text-red-500 text-[11px]">{checkError ?? convertState.error}</p>
          )}
          <button
            type="button"
            onClick={handleConvertClick}
            disabled={isWorking}
            className="flex items-center gap-2 bg-[#000080] hover:bg-[#0000a0] text-white text-[10px] tracking-widest uppercase px-5 py-2.5 rounded-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isWorking ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {stage === "checking" ? "Checking..." : "Converting..."}
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Convert to Client
              </>
            )}
          </button>
        </div>
      )}

      {/* Duplicate found modal */}
      {stage === "modal" && duplicate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => !isWorking && setStage("idle")}
          />

          {/* Card */}
          <div className="relative bg-white rounded-sm border border-slate-200 shadow-xl max-w-md w-full p-6 flex flex-col gap-5">

            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div>
                <h2 className="text-slate-900 text-sm font-bold">Existing Contact Found</h2>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                  A contact with a matching email or phone already exists. How would you like to proceed?
                </p>
              </div>
            </div>

            {/* Existing contact info */}
            <div className="bg-slate-50 border border-slate-200 rounded-sm px-4 py-3 flex flex-col gap-1">
              <p className="text-slate-800 text-sm font-semibold">{duplicate.name ?? "Unnamed Contact"}</p>
              {duplicate.email && <p className="text-slate-500 text-xs">{duplicate.email}</p>}
              {duplicate.phone && <p className="text-slate-500 text-xs">{duplicate.phone}</p>}
            </div>

            {/* Options */}
            <div className="flex flex-col gap-3">

              {/* Merge */}
              <form action={mergeAction}>
                <input type="hidden" name="lead_id"    value={leadId}       />
                <input type="hidden" name="contact_id" value={duplicate.id} />
                {mergeState.error && (
                  <p className="text-red-500 text-[11px] mb-1">{mergeState.error}</p>
                )}
                <button
                  type="submit"
                  disabled={isMerging || isConverting}
                  className="w-full flex items-center justify-center gap-2 bg-[#000080] hover:bg-[#0000a0] text-white text-xs font-semibold px-4 py-3 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isMerging ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Merging...
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                        <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                      </svg>
                      Merge into {duplicate.name ?? "Existing Contact"}
                    </>
                  )}
                </button>
                <p className="text-slate-400 text-[10px] mt-1.5 leading-relaxed text-center">
                  Attaches vessel data and lead message to the existing profile. Removes this lead.
                </p>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-slate-300 text-[10px] uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Create new */}
              <form action={convertAction}>
                <input type="hidden" name="lead_id"      value={leadId} />
                <input type="hidden" name="force_create" value="true"   />
                {convertState.error && (
                  <p className="text-red-500 text-[11px] mb-1">{convertState.error}</p>
                )}
                <button
                  type="submit"
                  disabled={isMerging || isConverting}
                  className="w-full border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 text-xs font-medium px-4 py-2.5 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isConverting ? "Creating..." : "Create New Profile"}
                </button>
                <p className="text-slate-400 text-[10px] mt-1.5 leading-relaxed text-center">
                  Creates a separate contact record for this lead.
                </p>
              </form>

            </div>

            {/* Cancel */}
            <button
              type="button"
              onClick={() => setStage("idle")}
              disabled={isWorking}
              className="text-slate-400 hover:text-slate-600 text-xs text-center transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

          </div>
        </div>
      )}
    </>
  );
}
