"use client";

import { useState, useTransition } from "react";
import { deleteTimelineEvent } from "@/app/actions";

type CorrespondenceEvent = {
  id: string;
  created_at: string;
  event_type: string;
  title: string | null;
  body: string | null;
  created_by: string | null;
  metadata?: Record<string, string> | null;
};

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function DirectionBadge({ title }: { title: string | null }) {
  if (!title) return null;
  const t = title.toLowerCase();
  if (t.includes("missed"))
    return <span className="text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm font-medium bg-red-50 text-red-500 border border-red-100">Missed</span>;
  if (t.includes("voicemail"))
    return <span className="text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm font-medium bg-amber-50 text-amber-600 border border-amber-100">Voicemail</span>;
  if (t.includes("inbound"))
    return <span className="text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">Inbound</span>;
  if (t.includes("outbound"))
    return <span className="text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm font-medium bg-blue-50 text-blue-600 border border-blue-100">Outbound</span>;
  return null;
}

function CorrespondenceItem({ ev, isLast }: { ev: CorrespondenceEvent; isLast: boolean }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      await deleteTimelineEvent(ev.id);
      setDeleted(true);
    });
  }

  if (deleted) return null;

  const isCall = ev.event_type === "call";
  const recordingUrl = ev.metadata?.recording_url;

  return (
    <li className={`flex gap-3 relative group px-6 py-3.5 ${!isLast ? "border-b border-slate-100" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isCall ? "bg-purple-50" : "bg-blue-50"}`}>
        {isCall ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-700 text-xs font-medium">{ev.title ?? (isCall ? "Call" : "SMS")}</span>
          <DirectionBadge title={ev.title} />
          <span className="text-slate-300 text-[10px] ml-auto whitespace-nowrap">{fmtFull(ev.created_at)}</span>
          {!confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all p-0.5 ml-1"
              title="Delete"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
        </div>

        {ev.body && (
          <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{ev.body}</p>
        )}

        {recordingUrl && (
          <a
            href={recordingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-[#000080] hover:underline mt-1"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
            </svg>
            Listen to recording
          </a>
        )}

        {ev.created_by && ev.created_by !== "system" && (
          <p className="text-slate-300 text-[10px] mt-0.5">
            by {ev.created_by.charAt(0).toUpperCase() + ev.created_by.slice(1)}
          </p>
        )}

        {confirmDelete && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-red-500 text-[10px]">Delete this event?</span>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-white bg-red-500 hover:bg-red-600 text-[10px] tracking-widest uppercase px-3 py-1 rounded-sm disabled:opacity-50 transition-colors font-medium"
            >
              {isPending ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-slate-400 hover:text-slate-600 text-[10px] tracking-widest uppercase px-2 py-1 rounded-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export default function CorrespondenceTimeline({ events }: { events: CorrespondenceEvent[] }) {
  const items = events.filter((ev) => ev.event_type === "call" || ev.event_type === "sms");

  if (items.length === 0) {
    return <p className="text-slate-400 text-sm px-6 py-8">No calls or texts logged yet.</p>;
  }

  return (
    <ul className="flex flex-col max-h-[560px] overflow-y-auto">
      {items.map((ev, i) => (
        <CorrespondenceItem key={ev.id} ev={ev} isLast={i === items.length - 1} />
      ))}
    </ul>
  );
}
