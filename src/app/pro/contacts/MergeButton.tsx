"use client";

import { useState, useTransition } from "react";
import { mergeContacts } from "@/app/actions";

type ContactRef = { id: string; name: string | null };

export default function MergeButton({ group }: { group: ContactRef[] }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (group.length !== 2) return null;

  // Keep the named contact; drop the unnamed one
  const named = group.find((c) => c.name) ?? group[0];
  const unnamed = group.find((c) => c.id !== named.id)!;

  function handleMerge() {
    startTransition(async () => {
      const result = await mergeContacts(named.id, unnamed.id);
      if (result.error) {
        setError(result.error);
      } else {
        setDone(true);
      }
    });
  }

  if (done) return null;

  return (
    <div className="flex items-center gap-2 mt-0.5">
      <span className="text-amber-600 text-[10px]">
        Keep <strong>{named.name}</strong>, delete unnamed?
      </span>
      <button
        onClick={handleMerge}
        disabled={pending}
        className="text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-sm bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
      >
        {pending ? "Merging..." : "Merge"}
      </button>
      {error && <span className="text-red-600 text-[10px]">{error}</span>}
    </div>
  );
}
