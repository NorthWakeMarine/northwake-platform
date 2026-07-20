export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import Link from "next/link";
import TimeDisplay from "./TimeDisplay";
import DeleteCallButton from "./DeleteCallButton";
import CreateLeadButton from "./CreateLeadButton";

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
    quo_call_id?: string;
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
    .limit(500);

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

function formatDuration(raw: number): string {
  // Normalize ms to seconds if value exceeds 1 day
  const seconds = raw > 86400 ? Math.round(raw / 1000) : raw;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}


async function getKnownContactPhones(): Promise<Set<string>> {
  const supabase = svc();
  const { data } = await supabase.from("contacts").select("phone").not("phone", "is", null);
  return new Set((data ?? []).map((r) => r.phone).filter(Boolean));
}

export default async function CallsPage() {
  const [calls, leadPhones] = await Promise.all([getCalls(), getKnownContactPhones()]);

  const totalCalls = calls.filter((c) => c.event_type === "call").length;
  const totalSms = calls.filter((c) => c.event_type === "sms").length;
  const inbound = calls.filter((c) => c.metadata?.direction === "inbound").length;

  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        <div className="bg-[#eceef1] border-b border-[#dcdee3] px-4 md:px-8 py-5">
          <h1 className="text-[#1E2938] text-xl font-bold tracking-tight">Calls</h1>
          <p className="text-[#1E2938]/50 text-sm mt-0.5">Inbound and outbound activity from Quo.</p>
        </div>

        <div className="bg-[#F1F2F5] border-b border-[#dcdee3] px-4 md:px-8 py-2.5 flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="text-[#1E2938] text-sm font-bold tabular-nums">{totalCalls}</span>
            <span className="text-[#1E2938]/45 text-xs">calls</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#1E2938] text-sm font-bold tabular-nums">{totalSms}</span>
            <span className="text-[#1E2938]/45 text-xs">sms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#1E2938] text-sm font-bold tabular-nums">{inbound}</span>
            <span className="text-[#1E2938]/45 text-xs">inbound</span>
          </div>
        </div>

        <div className="flex-1 px-4 md:px-8 py-6 flex flex-col gap-4">
          {calls.length === 0 ? (
            <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="chrome-text-dark">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <p className="text-slate-400 text-[10px] tracking-[0.2em] uppercase">No calls logged yet</p>
              <p className="text-slate-400/70 text-xs max-w-xs leading-relaxed">
                Calls and texts from Quo appear here automatically via webhook.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block bg-[#F1F2F5] neu-card rounded-md overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] text-[11px] tracking-widest uppercase font-semibold text-[#1E2938]/50 px-4 py-2.5 border-b border-[#dcdee3] gap-4">
                  <span>Type</span>
                  <span>Contact</span>
                  <span>Direction</span>
                  <span>Duration</span>
                  <span>Date</span>
                  <span></span>
                </div>
                <div className="divide-y divide-[#dcdee3]/60">
                  {calls.map((c) => {
                    const dir = c.metadata?.direction ?? "inbound";
                    const duration = c.metadata?.duration;
                    const phone = c.metadata?.caller_number ?? c.metadata?.from_number ?? c.contact_phone;

                    return (
                      <div key={c.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center px-4 py-3 gap-4 hover:bg-white/60 transition-colors">
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
                            <Link href={`/pro/contacts/${c.contact_id}`} className="text-slate-800 text-sm font-medium hover:text-[#000080] transition-colors truncate block">
                              {c.contact_name ?? phone ?? "Unknown"}
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 text-sm truncate">{phone ?? "Unknown number"}</span>
                              {phone && <CreateLeadButton phone={phone} isLead={leadPhones.has(phone)} />}
                            </div>
                          )}
                          {c.body && c.event_type === "sms" && (
                            <p className="text-slate-400 text-[10px] truncate mt-0.5">{c.body}</p>
                          )}
                        </div>
                        <span className={`text-[11px] tracking-widest uppercase font-medium ${dir === "outbound" ? "text-navy" : "text-slate-500"}`}>
                          {dir}
                        </span>
                        <span className="text-slate-400 text-xs tabular-nums">
                          {duration != null ? formatDuration(duration) : c.event_type === "call" ? "--" : ""}
                        </span>
                        <div className="text-right">
                          <TimeDisplay iso={c.created_at} />
                        </div>
                        <div className="flex justify-end">
                          <DeleteCallButton id={c.id} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden flex flex-col gap-2">
                {calls.map((c) => {
                  const dir = c.metadata?.direction ?? "inbound";
                  const duration = c.metadata?.duration;
                  const phone = c.metadata?.caller_number ?? c.metadata?.from_number ?? c.contact_phone;
                  const typeBadge = c.event_type === "sms"
                    ? <span className="text-[9px] tracking-widest uppercase font-semibold px-2 py-0.5 rounded-sm bg-blue-50 text-blue-600 border border-blue-100">SMS</span>
                    : c.title.includes("Missed")
                    ? <span className="text-[9px] tracking-widest uppercase font-semibold px-2 py-0.5 rounded-sm bg-red-50 text-red-600 border border-red-100">Missed</span>
                    : c.title.includes("Voicemail")
                    ? <span className="text-[9px] tracking-widest uppercase font-semibold px-2 py-0.5 rounded-sm bg-amber-50 text-amber-600 border border-amber-100">Voicemail</span>
                    : <span className="text-[9px] tracking-widest uppercase font-semibold px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-600 border border-emerald-100">Call</span>;

                  return (
                    <div key={c.id} className="bg-white rounded-xl px-4 py-3.5 shadow-sm flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {typeBadge}
                          {c.contact_id ? (
                            <Link href={`/pro/contacts/${c.contact_id}`} className="text-slate-800 text-sm font-semibold truncate hover:text-[#000080] transition-colors">
                              {c.contact_name ?? phone ?? "Unknown"}
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-slate-600 text-sm font-semibold truncate">{phone ?? "Unknown number"}</span>
                              {phone && <CreateLeadButton phone={phone} isLead={leadPhones.has(phone)} />}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <TimeDisplay iso={c.created_at} />
                          <DeleteCallButton id={c.id} />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-medium uppercase tracking-wider ${dir === "outbound" ? "text-[#000080]" : "text-slate-500"}`}>
                          {dir}
                        </span>
                        {duration != null && (
                          <span className="text-slate-400 text-xs tabular-nums">{formatDuration(duration)}</span>
                        )}
                        {c.body && c.event_type === "sms" && (
                          <p className="text-slate-400 text-xs truncate flex-1">{c.body}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </ProShell>
  );
}
