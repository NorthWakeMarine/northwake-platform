"use client";

import { useEffect, useState } from "react";
import { createQuickBooksInvoiceDraft } from "@/app/actions";
import type { PipelineCard } from "@/types/pipeline";

export default function InvoiceDraftModal({
  card,
  onClose,
}: {
  card: PipelineCard;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<{
    name: string;
    email: string | null;
    phone: string | null;
    vesselName: string | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!card.contactId) return;
    createQuickBooksInvoiceDraft(card.contactId).then((res) => {
      if (!("error" in res)) setDetails(res);
    });
  }, [card.contactId]);

  function handleCopy() {
    if (!details) return;
    const text = [
      `Client: ${details.name}`,
      details.email   ? `Email: ${details.email}`      : null,
      details.phone   ? `Phone: ${details.phone}`      : null,
      details.vesselName ? `Vessel: ${details.vesselName}` : null,
      `Stage: Done / Invoiced`,
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-sm flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-slate-800 text-sm font-semibold">Create Invoice</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-sm px-4 py-3 text-amber-700 text-xs leading-relaxed">
            QuickBooks integration coming soon. Copy the details below to create the invoice manually.
          </div>

          {details ? (
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs uppercase tracking-wider">Client</span>
                <span className="text-slate-800 font-medium">{details.name}</span>
              </div>
              {details.email && (
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs uppercase tracking-wider">Email</span>
                  <span className="text-slate-600 text-xs">{details.email}</span>
                </div>
              )}
              {details.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs uppercase tracking-wider">Phone</span>
                  <span className="text-slate-600 text-xs">{details.phone}</span>
                </div>
              )}
              {details.vesselName && (
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs uppercase tracking-wider">Vessel</span>
                  <span className="text-slate-600 text-xs">{details.vesselName}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-16 flex items-center justify-center">
              <span className="text-slate-400 text-xs">Loading...</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={handleCopy}
            disabled={!details}
            className="flex-1 bg-[#000080] text-white text-xs font-semibold py-2.5 rounded-sm hover:bg-blue-900 transition-colors disabled:opacity-40"
          >
            {copied ? "Copied!" : "Copy Invoice Details"}
          </button>
          <button
            onClick={onClose}
            className="px-4 text-slate-500 text-xs font-medium hover:text-slate-800 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
