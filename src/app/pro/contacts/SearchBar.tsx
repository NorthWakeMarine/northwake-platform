"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef, useTransition } from "react";

export default function SearchBar({ initialQ = "" }: { initialQ?: string }) {
  const router      = useRouter();
  const pathname    = usePathname();
  const [isPending, startTransition] = useTransition();
  const inputRef    = useRef<HTMLInputElement>(null);

  function push(value: string) {
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    startTransition(() => {
      router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
    });
  }

  return (
    <div className="relative flex items-center">
      <svg
        className="absolute left-3 text-slate-300 pointer-events-none"
        width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        defaultValue={initialQ}
        onChange={(e) => push(e.target.value)}
        placeholder="Search contacts, vessels, household..."
        className={`pl-8 pr-8 py-2 text-xs border border-slate-200 rounded-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 w-72 transition-opacity ${isPending ? "opacity-50" : ""}`}
      />
      {initialQ && (
        <button
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
            push("");
          }}
          className="absolute right-2.5 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
