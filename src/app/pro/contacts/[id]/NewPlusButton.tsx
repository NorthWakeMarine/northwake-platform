"use client";

import { useState } from "react";
import NewPlusModal from "@/components/NewPlusModal";

type VesselOption = { id: string; name: string | null; make_model: string | null; length_ft: string | null };

export default function NewPlusButton({
  contactId,
  contactName,
  vessels,
}: {
  contactId:   string;
  contactName: string;
  vessels:     VesselOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-[#000080] text-white text-[10px] tracking-widest uppercase font-semibold px-4 py-2 rounded-sm hover:bg-blue-900 transition-colors"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New+
      </button>
      {open && (
        <NewPlusModal
          onClose={() => setOpen(false)}
          preContactId={contactId}
          preContactName={contactName}
          preVessels={vessels}
        />
      )}
    </>
  );
}
