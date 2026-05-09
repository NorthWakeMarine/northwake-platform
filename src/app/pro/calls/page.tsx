export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import Link from "next/link";

type CallRow = {
  id: string;
  contact_id: string | null;
  event_type: string;
  title: string;
  body: string | null;
  metadata: {
    direction?: string;
    duration?: number;
    recording_url?: string | null;
    caller_number?: string;
    from_number?: string;
    dialpad_call_id?: string;
  } | null;
  created_at: string;
  contact_name: string | null;
  contact_phone: string | null;
};

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

async function getCalls(): Promise<CallRow[]> {
  const supabase = svc();
  const { data } = await supabase
    .from("timeline_events")
    .select(`
      id, contact_id, event_type, title, body, metadata, created_at,
      contacts ( name, phone )
    `)
    .in("event_type", ["call", "sms"])
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((r) => ({
    id: r.id,
    contact_id: r.contact_id,
    event_type: r.event_type,
    title: r.title,
    body: r.body,
    metadata: r.metadata,
    created_at: r.created_at,
    contact_name: (r.contacts as unknown as { name: string; phone: string } | null)?.name ?? null,
    contact_phone: (r.contacts as unknown as { name: string; phone: string } | null)?.phone ?? null,
  }));
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function CallsPage() {
  const calls = await getCalls();

  const totalCalls = calls.filter((c) => c.event_type === "call").length;
  const totalSms = calls.filter((c) => c.event_type === "sms").length;
  const inbound = calls.filter((c) => c.metadata?.direction === "inbound").length;

  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        <div className="bg-white border-b border-slate-200 px-8 py-5">
          <h1 className="text-slate-900 text-xl font-bold tracking-tight">Calls</h1>
          <p className="text-slate-400 text-xs mt-0.5">Inbound and outbound activity from Dialpad.</p>
        </div>

        <div className="bg-white border-b border-slate-100 px-8 py-3 flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-800 text-sm font-bold">{totalCalls}</span>
            <span className="text-slate-400 text-xs">calls</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-800 text-sm font-bold">{totalSms}</span>
            <span className="text-slate-400 text-xs">sms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-800 text-sm font-bold">{inbound}</span>
            <span className="text-slate-400 text-xs">inbound</span>
          </div>
        </div>

        <div className="flex-1 px-8 py-6">
          {calls.length === 0 ? (
            <p className="text-slate-400 text-sm">No calls logged yet. Connect Dialpad and register the webhook to start capturing activity.</p>
          ) : (
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] text-[10px] tracking-widest uppercase font-semibold text-slate-400 px-4 py-2.5 border-b border-slate-100 gap-4">
                <span>Type</span>
                <span>Contact</span>
                <span>Direction</span>
                <span>Duration</span>
                <span>Date</span>
              </div>
              <div className="divide-y divide-slate-100">
                {calls.map((c) => {
                  const dir = c.metadata?.direction ?? "inbound";
                  const duration = c.metadata?.duration;
                  const phone = c.metadata?.caller_number ?? c.metadata?.from_number ?? c.contact_phone;

                  return (
                    <div key={c.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center px-4 py-3 gap-4 hover:bg-slate-50 transition-colors">
                      <div>
                        {c.event_type === "sms" ? (
                          <span className="text-[9px] tracking-widest uppercase font-semibold px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-600 border border-blue-100">SMS</span>
                        ) : c.title.includes("Missed") ? (
                          <span className="text-[9px] tracking-widest uppercase font-semibold px-1.5 py-0.5 rounded-sm bg-red-50 text-red-600 border border-red-100">Missed</span>
                        ) : c.title.includes("Voicemail") ? (
                          <span className="text-[9px] tracking-widest uppercase font-semibold px-1.5 py-0.5 rounded-sm bg-amber-50 text-amber-600 border border-amber-100">VM</span>
                        ) : (
                          <span className="text-[9px] tracking-widest uppercase font-semibold px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-600 border border-emerald-100">Call</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        {c.contact_id ? (
                          <Link href={`/pro/contacts/${c.contact_id}`} className="text-slate-800 text-xs font-medium hover:text-[#000080] transition-colors truncate block">
                            {c.contact_name ?? phone ?? "Unknown"}
                          </Link>
                        ) : (
                          <span className="text-slate-500 text-xs truncate block">{phone ?? "Unknown number"}</span>
                        )}
                        {c.body && c.event_type === "sms" && (
                          <p className="text-slate-400 text-[10px] truncate mt-0.5">{c.body}</p>
                        )}
                      </div>

                      <span className={`text-[10px] tracking-widest uppercase font-medium ${dir === "outbound" ? "text-navy" : "text-slate-500"}`}>
                        {dir}
                      </span>

                      <span className="text-slate-400 text-xs tabular-nums">
                        {duration != null ? formatDuration(duration) : c.event_type === "call" ? "--" : ""}
                      </span>

                      <div className="text-right">
                        <span className="text-slate-500 text-xs">{formatDate(c.created_at)}</span>
                        <span className="text-slate-400 text-[10px] block">{formatTime(c.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProShell>
  );
}
