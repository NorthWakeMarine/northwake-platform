"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createContact } from "@/app/actions";

type Props = { defaultType?: "customer" | "vendor" };

export default function CreateContactModal({ defaultType = "customer" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    address: "",
    contact_type: defaultType,
    waiver_signed: false,
  });

  function handleOpen() {
    setDraft({ name: "", company_name: "", email: "", phone: "", address: "", contact_type: defaultType, waiver_signed: false });
    setError(null);
    setOpen(true);
  }

  function handleClose() {
    if (isPending) return;
    setOpen(false);
  }

  function handleSave() {
    if (!draft.name.trim() && !draft.email.trim() && !draft.phone.trim()) {
      setError("Provide at least a name, email, or phone number.");
      return;
    }
    startTransition(async () => {
      const res = await createContact(draft);
      if (!res.ok) { setError(res.error ?? "Failed to create contact."); return; }
      setOpen(false);
      router.push(`/pro/contacts/${res.id}`);
    });
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center justify-center gap-1.5 bg-[#000080] hover:bg-[#0000a0] text-white text-[10px] tracking-widest uppercase font-semibold px-3 py-2 rounded-sm transition-colors whitespace-nowrap w-full sm:w-auto"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Contact
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
          <div className="relative bg-white rounded-t-xl sm:rounded-md shadow-xl w-full sm:max-w-md flex flex-col max-h-[90dvh]">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="text-slate-800 text-sm font-bold">New Contact</h2>
              <button onClick={handleClose} disabled={isPending} className="text-slate-300 hover:text-slate-500 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 flex flex-col gap-3 overflow-y-auto">

              {/* Type */}
              <div>
                <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400 mb-1 block">Type</label>
                <select
                  value={draft.contact_type}
                  onChange={(e) => setDraft((d) => ({ ...d, contact_type: e.target.value as "customer" | "vendor" }))}
                  className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#000080] bg-white"
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400 mb-1 block">Name</label>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#000080]"
                  placeholder="Full name"
                />
              </div>

              {/* Company (vendors only) */}
              {draft.contact_type === "vendor" && (
                <div>
                  <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400 mb-1 block">Company</label>
                  <input
                    value={draft.company_name}
                    onChange={(e) => setDraft((d) => ({ ...d, company_name: e.target.value }))}
                    className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#000080]"
                    placeholder="Company name"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400 mb-1 block">Email</label>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#000080]"
                  placeholder="email@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400 mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                  className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#000080]"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* Address */}
              <div>
                <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400 mb-1 block">Address</label>
                <textarea
                  value={draft.address}
                  onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                  rows={2}
                  className="w-full border border-slate-300 rounded-sm px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#000080] resize-none"
                  placeholder="Street address"
                />
              </div>

              {/* Waiver (customers only) */}
              {draft.contact_type === "customer" && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.waiver_signed}
                    onChange={(e) => setDraft((d) => ({ ...d, waiver_signed: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-[#000080]"
                  />
                  <span className="text-slate-700 text-xs">Waiver already signed</span>
                </label>
              )}

              {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-200">
              <button
                onClick={handleClose}
                disabled={isPending}
                className="text-slate-400 hover:text-slate-600 text-[10px] tracking-widest uppercase font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="bg-[#000080] hover:bg-[#0000a0] disabled:opacity-50 text-white text-[10px] tracking-widest uppercase font-semibold px-4 py-2 rounded-sm transition-colors"
              >
                {isPending ? "Creating..." : "Create Contact"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
