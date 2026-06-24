"use client";

import { useState } from "react";
import { createLeadFromCall } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function NewLeadButton() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [source, setSource] = useState("website");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    await createLeadFromCall(phone.trim(), name.trim() || undefined, source);
    setLoading(false);
    setOpen(false);
    setPhone("");
    setName("");
    setSource("website");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] tracking-widest uppercase font-semibold px-4 py-2 bg-[#000080] text-white hover:bg-[#000060] transition-colors"
      >
        + New Lead
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setOpen(false)}>
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={submit}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4"
          >
            <h2 className="text-slate-800 text-base font-bold tracking-tight">New Lead</h2>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Phone *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (904) 000-0000"
                required
                className="border border-gray-500 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-navy"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Smith"
                className="border border-gray-500 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-navy"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Lead Source</label>
              <select
                value={source}
                onChange={e => setSource(e.target.value)}
                className="border border-gray-500 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-navy bg-white"
              >
                <option value="quo">Quo</option>
                <option value="google">Google</option>
                <option value="meta">Meta</option>
                <option value="website">Website</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500 px-4 py-2 hover:text-slate-700 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="text-[10px] tracking-widest uppercase font-semibold px-5 py-2 bg-[#000080] text-white hover:bg-[#000060] transition-colors disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Lead"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
