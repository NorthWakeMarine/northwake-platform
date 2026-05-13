"use client";

export default function TimeDisplay({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <>
      <span className="text-slate-500 text-xs">
        {d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </span>
      <span className="text-slate-400 text-[10px] block">
        {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </span>
    </>
  );
}
