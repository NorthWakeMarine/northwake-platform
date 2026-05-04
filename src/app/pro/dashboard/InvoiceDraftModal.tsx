"use client";

import { useState, useTransition } from "react";
import { createQuickBooksInvoiceDraft } from "@/app/actions";
import type { PipelineCard } from "@/types/pipeline";

export default function InvoiceDraftModal({
  card,
  onClose,
}: {
  card: PipelineCard;
  onClose: () => void;
}) {
  const [result, setResult] = useState<{ invoiceUrl?: string; docNumber?: string; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!card.contactId) return;
    startTransition(async () => {
      const res = await createQuickBooksInvoiceDraft(card.contactId!);
      setResult(res);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-sm flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-slate-800 text-sm font-semibold">Create Invoice</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4">
          {result?.invoiceUrl ? (
            <div className="flex flex-col gap-3">
              <p className="text-emerald-600 text-sm font-medium">Draft invoice created in QuickBooks.</p>
              <a
                href={result.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-widest uppercase text-[#000080] underline font-semibold"
              >
                Open Invoice #{result.docNumber} in QuickBooks
              </a>
            </div>
          ) : (
            <>
              {result?.error && (
                <p className="text-red-500 text-xs">{result.error}</p>
              )}
              <p className="text-slate-500 text-xs leading-relaxed">
                This will create a pre-filled draft invoice in QuickBooks for {card.name}.
              </p>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          {!result?.invoiceUrl && (
            <button
              onClick={handleCreate}
              disabled={isPending || !card.contactId}
              className="flex-1 bg-[#000080] text-white text-xs font-semibold py-2.5 rounded-sm hover:bg-blue-900 transition-colors disabled:opacity-40"
            >
              {isPending ? "Creating..." : "Generate Draft Invoice"}
            </button>
          )}
          <button onClick={onClose} className="px-4 text-slate-500 text-xs font-medium hover:text-slate-800 transition-colors">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
