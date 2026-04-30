"use client";

import { useState } from "react";

type Range = "month" | "year" | "all";


export default function LeadStatCard({
  monthCount,
  yearCount,
  allCount,
  monthLabel,
  yearLabel,
}: {
  monthCount: number;
  yearCount:  number;
  allCount:   number;
  monthLabel: string;
  yearLabel:  string;
}) {
  const [range, setRange] = useState<Range>("month");

  const value = range === "month" ? monthCount : range === "year" ? yearCount : allCount;
  const sub   = range === "month" ? monthLabel : range === "year" ? yearLabel : "All time";

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-slate-500 text-xs font-medium">New Leads</p>
        <div className="w-9 h-9 rounded-sm bg-emerald-50 flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
          </svg>
        </div>
      </div>
      <div>
        <p className="text-slate-900 text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-slate-400 text-[11px] mt-1">{sub}</p>
      </div>
      <div className="flex gap-1">
        {(["month", "year", "all"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-1 text-[9px] tracking-widest uppercase font-semibold py-1 rounded-sm transition-colors ${
              range === r
                ? "bg-[#000080] text-white"
                : "bg-slate-100 text-slate-400 hover:text-slate-600"
            }`}
          >
            {r === "month" ? "Mo" : r === "year" ? "Yr" : "All"}
          </button>
        ))}
      </div>
    </div>
  );
}
