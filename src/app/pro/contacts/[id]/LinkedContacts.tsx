"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addLinkedContact,
  toggleLinkedContactAuth,
  removeLinkedContact,
  type LinkedContactState,
} from "@/app/actions";

export type LinkedContact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  relationship: string | null;
  authorized_to_approve: boolean | null;
};

const relationshipLabel: Record<string, string> = {
  spouse:    "Spouse",
  assistant: "Assistant",
  family:    "Family",
  associate: "Associate",
  other:     "Other",
};

function AuthToggle({ lc, contactId }: { lc: LinkedContact; contactId: string }) {
  const [, action, isPending] = useActionState<LinkedContactState, FormData>(toggleLinkedContactAuth, {});
  const authorized = lc.authorized_to_approve ?? false;
  return (
    <form action={action}>
      <input type="hidden" name="id"         value={lc.id} />
      <input type="hidden" name="contact_id" value={contactId} />
      <input type="hidden" name="authorized" value={(!authorized).toString()} />
      <button
        type="submit"
        disabled={isPending}
        title={authorized ? "Click to revoke approval rights" : "Click to grant approval rights"}
        className={`text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium border transition-colors disabled:opacity-50 ${
          authorized
            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
            : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
        }`}
      >
        {authorized ? "Authorized" : "Not Auth."}
      </button>
    </form>
  );
}

function RemoveButton({ lcId, contactId }: { lcId: string; contactId: string }) {
  const [, action, isPending] = useActionState<LinkedContactState, FormData>(removeLinkedContact, {});
  return (
    <form action={action}>
      <input type="hidden" name="id"         value={lcId} />
      <input type="hidden" name="contact_id" value={contactId} />
      <button
        type="submit"
        disabled={isPending}
        title="Remove"
        className="text-slate-300 hover:text-red-400 transition-colors disabled:opacity-50"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </form>
  );
}

function AddForm({ contactId, onDone }: { contactId: string; onDone: () => void }) {
  const [state, action, isPending] = useActionState<LinkedContactState, FormData>(addLinkedContact, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onDone();
    }
  }, [state.success, onDone]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3 pt-3 border-t border-slate-100 mt-1">
      <input type="hidden" name="primary_contact_id" value={contactId} />
      <p className="text-slate-700 text-[11px] font-semibold">Add Linked Contact</p>
      {state.error && <p className="text-red-500 text-[11px]">{state.error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Full Name *</label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Sarah Johnson"
            className="border border-slate-200 rounded-sm px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Relationship</label>
          <select
            name="relationship"
            className="border border-slate-200 rounded-sm px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400 bg-white"
          >
            <option value="spouse">Spouse</option>
            <option value="assistant">Assistant</option>
            <option value="family">Family</option>
            <option value="associate">Associate</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Phone</label>
          <input
            type="tel"
            name="phone"
            placeholder="(904) 555-0100"
            className="border border-slate-200 rounded-sm px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400"
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-[10px] tracking-widest uppercase font-medium text-slate-400">Email</label>
          <input
            type="email"
            name="email"
            placeholder="sarah@example.com"
            className="border border-slate-200 rounded-sm px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end">
        <button type="button" onClick={onDone} className="text-slate-400 hover:text-slate-600 text-xs transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="bg-[#000080] hover:bg-[#0000a0] text-white text-[10px] tracking-widest uppercase px-4 py-2 rounded-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {isPending ? "Adding..." : "Add"}
        </button>
      </div>
    </form>
  );
}

export default function LinkedContacts({
  contactId,
  linkedContacts,
}: {
  contactId: string;
  linkedContacts: LinkedContact[];
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-800 text-sm font-semibold">Household</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-[#000080] hover:text-[#0000a0] font-semibold transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add
          </button>
        )}
      </div>

      {linkedContacts.length === 0 && !showForm ? (
        <p className="text-slate-300 text-xs">No linked contacts yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {linkedContacts.map((lc) => (
            <li key={lc.id} className="flex flex-col gap-1.5 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-slate-500 text-[9px] font-bold">{lc.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-800 text-xs font-semibold truncate">{lc.name}</p>
                    <p className="text-slate-400 text-[10px]">
                      {relationshipLabel[lc.relationship ?? ""] ?? lc.relationship ?? "Associate"}
                    </p>
                  </div>
                </div>
                <RemoveButton lcId={lc.id} contactId={contactId} />
              </div>

              {lc.phone && (
                <div className="flex flex-col gap-1">
                  <p className="text-slate-500 text-[11px]">{lc.phone}</p>
                  <div className="flex gap-1.5">
                    <a
                      href={`tel:${lc.phone}`}
                      className="flex items-center gap-1 text-[9px] tracking-widest uppercase font-semibold px-2.5 py-1 rounded-sm border border-slate-200 text-slate-500 hover:border-[#000080] hover:text-[#000080] transition-colors"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.89 12 19.79 19.79 0 0 1 1.85 3.37 2 2 0 0 1 3.84 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.93-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      Call
                    </a>
                    <a
                      href={`sms:${lc.phone}`}
                      className="flex items-center gap-1 text-[9px] tracking-widest uppercase font-semibold px-2.5 py-1 rounded-sm border border-slate-200 text-slate-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Text
                    </a>
                  </div>
                </div>
              )}
              {lc.email && (
                <a href={`mailto:${lc.email}`} className="text-slate-500 text-[11px] hover:text-blue-600 transition-colors truncate">
                  {lc.email}
                </a>
              )}

              <AuthToggle lc={lc} contactId={contactId} />
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <AddForm contactId={contactId} onDone={() => setShowForm(false)} />
      )}
    </div>
  );
}
