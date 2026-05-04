"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const OPTIONS = [
  { value: "",         label: "All" },
  { value: "customer", label: "Customers" },
  { value: "vendor",   label: "Vendors" },
] as const;

export default function TypeFilter({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("type", value);
    else params.delete("type");
    startTransition(() => {
      router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
    });
  }

  return (
    <div className="flex items-center gap-1 border border-slate-200 rounded-sm p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => select(opt.value)}
          className={`px-3 py-1.5 text-[10px] tracking-widest uppercase font-medium rounded-sm transition-colors ${
            current === opt.value
              ? "bg-[#000080] text-white"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
