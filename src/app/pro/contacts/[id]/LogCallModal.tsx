"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { logManualCall } from "@/app/actions";

export default function LogCallModal({ contactId }: { contactId: string }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [direction, setDirection] = useState<"inbound" | "outbound">("outbound");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handleSubmit() {
    if (!notes.trim()) { setError("Please add call notes."); return; }
    setError("");
    startTransition(async () => {
      const res = await logManualCall(contactId, direction, notes);
      if (!res.ok) { setError(res.error ?? "Failed to log call."); return; }
      setOpen(false);
      setNotes("");
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm font-medium transition-colors"
      >
        Log Call
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Log a call">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div ref={dialogRef} className="relative bg-white rounded-sm border border-slate-200 shadow-xl w-full max-w-sm flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-slate-800 text-sm font-semibold">Log Call</h2>
              <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span className="sr-only">Close</span>
              </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex gap-2" role="group" aria-label="Call direction">
                {(["outbound", "inbound"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDirection(d)}
                    aria-pressed={direction === d}
                    className={`flex-1 py-2 text-xs font-medium rounded-sm border transition-colors capitalize ${
                      direction === d
                        ? "bg-[#000080] border-[#000080] text-white"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="log-call-notes" className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Notes</label>
                <textarea
                  id="log-call-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Call summary..."
                  className="border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs px-3 py-2 rounded-sm resize-none focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              {error && <p role="alert" className="text-red-500 text-[10px]">{error}</p>}

              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs transition-colors px-3 py-1.5">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="bg-[#000080] hover:bg-[#0000a0] text-white text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {isPending && (
                    <svg aria-hidden="true" className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {isPending ? "Saving..." : "Save Call"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
