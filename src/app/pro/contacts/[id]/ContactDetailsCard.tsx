"use client";

import { useState, useTransition } from "react";
import { updateContactFields } from "@/app/actions";

type Props = {
  contactId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  waiverSigned: boolean | null;
  status: string | null;
  source: string | null;
  contactType: string | null;
  companyName: string | null;
  createdAt: string;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ContactDetailsCard(props: Props) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    name:          props.name         ?? "",
    company_name:  props.companyName  ?? "",
    email:         props.email        ?? "",
    phone:         props.phone        ?? "",
    address:       props.address      ?? "",
    waiver_signed: props.waiverSigned ?? false,
    contact_type:  props.contactType  ?? "customer",
  });

  function handleSave() {
    startTransition(async () => {
      const res = await updateContactFields(props.contactId, { ...draft });
      if (!res.ok) { setError(res.error ?? "Save failed."); return; }
      setEditing(false);
      setError(null);
    });
  }

  function handleCancel() {
    setDraft({
      name:          props.name         ?? "",
      company_name:  props.companyName  ?? "",
      email:         props.email        ?? "",
      phone:         props.phone        ?? "",
      address:       props.address      ?? "",
      waiver_signed: props.waiverSigned ?? false,
      contact_type:  props.contactType  ?? "customer",
    });
    setEditing(false);
    setError(null);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-800 text-sm font-semibold">Contact Details</h3>
        {editing ? (
          <div className="flex items-center gap-2">
            {error && <span className="text-red-500 text-[10px]">{error}</span>}
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="text-slate-400 hover:text-slate-600 text-[10px] tracking-widest uppercase font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="text-[#000080] hover:text-[#0000a0] text-[10px] tracking-widest uppercase font-semibold transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-slate-300 hover:text-slate-500 transition-colors"
            title="Edit contact details"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}
      </div>

      <dl className="flex flex-col gap-3 text-xs">
        <div>
          <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Name</dt>
          <dd>
            {editing ? (
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-sm px-2 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#000080]"
                placeholder="Full name"
              />
            ) : (
              <span className="text-slate-700">{props.name || <span className="text-slate-300 italic">Not provided</span>}</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Company</dt>
          <dd>
            {editing ? (
              <input
                value={draft.company_name}
                onChange={(e) => setDraft((d) => ({ ...d, company_name: e.target.value }))}
                className="w-full border border-slate-200 rounded-sm px-2 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#000080]"
                placeholder="Company name"
              />
            ) : (
              <span className="text-slate-700">{props.companyName || <span className="text-slate-300 italic">Not provided</span>}</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Email</dt>
          <dd>
            {editing ? (
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                className="w-full border border-slate-200 rounded-sm px-2 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#000080]"
                placeholder="email@example.com"
              />
            ) : props.email ? (
              <a href={`mailto:${props.email}`} className="text-slate-700 hover:text-blue-600 transition-colors">{props.email}</a>
            ) : (
              <span className="text-slate-300 italic">Not provided</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Phone</dt>
          <dd>
            {editing ? (
              <input
                type="tel"
                value={draft.phone}
                onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                className="w-full border border-slate-200 rounded-sm px-2 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#000080]"
                placeholder="+1 (555) 000-0000"
              />
            ) : props.phone ? (
              <a href={`tel:${props.phone}`} className="text-slate-700 hover:text-blue-600 transition-colors">{props.phone}</a>
            ) : (
              <span className="text-slate-300 italic">Not provided</span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Address</dt>
          <dd>
            {editing ? (
              <textarea
                value={draft.address}
                onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                rows={2}
                className="w-full border border-slate-200 rounded-sm px-2 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#000080] resize-none"
                placeholder="Street address"
              />
            ) : (
              <span className="text-slate-700">{props.address || <span className="text-slate-300 italic">Not provided</span>}</span>
            )}
          </dd>
        </div>

        {props.contactType !== "vendor" && (
          <div>
            <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Waiver</dt>
            <dd>
              {editing ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.waiver_signed}
                    onChange={(e) => setDraft((d) => ({ ...d, waiver_signed: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-[#000080]"
                  />
                  <span className="text-slate-700 text-xs">Waiver signed</span>
                </label>
              ) : props.waiverSigned ? (
                <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">Signed</span>
              ) : (
                <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium bg-red-50 text-red-600 border border-red-200">Pending</span>
              )}
            </dd>
          </div>
        )}

        <div>
          <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Type</dt>
          <dd>
            {editing ? (
              <select
                value={draft.contact_type}
                onChange={(e) => setDraft((d) => ({ ...d, contact_type: e.target.value }))}
                className="w-full border border-slate-200 rounded-sm px-2 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-[#000080] bg-white"
              >
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="lead">Lead</option>
              </select>
            ) : (
              <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium border ${
                props.contactType === "vendor"
                  ? "bg-slate-50 text-slate-600 border-slate-200"
                  : props.contactType === "lead"
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "bg-emerald-50 text-emerald-600 border-emerald-200"
              }`}>
                {props.contactType ?? "customer"}
              </span>
            )}
          </dd>
        </div>

        {props.contactType !== "vendor" && (
          <div>
            <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Status</dt>
            <dd className="text-slate-700 capitalize">{props.status || "lead"}</dd>
          </div>
        )}

        <div>
          <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Source</dt>
          <dd className="text-slate-700 capitalize">{props.source || "website"}</dd>
        </div>

        <div>
          <dt className="text-slate-400 text-[10px] tracking-widest uppercase font-medium mb-0.5">Created</dt>
          <dd className="text-slate-700">{fmt(props.createdAt)}</dd>
        </div>
      </dl>
    </div>
  );
}
