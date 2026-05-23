export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";

type VesselService = {
  id: string;
  service_name: string | null;
  interval_days: number | null;
  last_service_date: string | null;
};

type Vessel = {
  id: string;
  name: string | null;
  make_model: string | null;
  year: number | null;
  length_ft: string | null;
  last_service_date: string | null;
  service_interval_days: number | null;
  asset_type: string | null;
  contacts: { id: string; name: string | null } | null;
  vessel_services: VesselService[];
};

type HealthStatus = "overdue" | "due_soon" | "healthy" | "unknown";

function serviceHealthStatus(lastDate: string | null, intervalDays: number | null): HealthStatus {
  if (!lastDate || !intervalDays) return "unknown";
  const days = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86_400_000);
  if (days >= intervalDays * 1.2) return "overdue";
  if (days >= intervalDays * 0.9) return "due_soon";
  return "healthy";
}

function vesselWorstHealth(vessel: Vessel): HealthStatus {
  const order: HealthStatus[] = ["overdue", "due_soon", "healthy", "unknown"];
  let worst: HealthStatus = "unknown";

  if (vessel.vessel_services.length > 0) {
    for (const s of vessel.vessel_services) {
      const h = serviceHealthStatus(s.last_service_date, s.interval_days);
      if (order.indexOf(h) < order.indexOf(worst)) worst = h;
    }
  } else {
    worst = serviceHealthStatus(vessel.last_service_date, vessel.service_interval_days);
  }
  return worst;
}

function nextDueService(vessel: Vessel): { name: string; daysAgo: number } | null {
  if (vessel.vessel_services.length === 0) return null;
  let earliest: { name: string; daysAgo: number } | null = null;
  for (const s of vessel.vessel_services) {
    if (!s.last_service_date || !s.interval_days) continue;
    const daysAgo = Math.floor((Date.now() - new Date(s.last_service_date).getTime()) / 86_400_000);
    const daysUntilDue = s.interval_days - daysAgo;
    if (!earliest || daysUntilDue < (s.interval_days - earliest.daysAgo)) {
      earliest = { name: s.service_name ?? "Service", daysAgo };
    }
  }
  return earliest;
}

const statusOrder: HealthStatus[] = ["overdue", "due_soon", "healthy", "unknown"];

export default async function VesselsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: rawVessels } = await supabase
    .from("vessels")
    .select(`
      id, name, make_model, year, length_ft,
      last_service_date, service_interval_days, asset_type,
      contacts!owner_id ( id, name ),
      vessel_services ( id, service_name, interval_days, last_service_date )
    `)
    .order("make_model", { ascending: true });

  const vessels = (rawVessels ?? []) as unknown as Vessel[];

  const healthMap = new Map<string, HealthStatus>();
  for (const v of vessels) {
    healthMap.set(v.id, vesselWorstHealth(v));
  }

  const sorted = [...vessels].sort((a, b) => {
    return statusOrder.indexOf(healthMap.get(a.id)!) - statusOrder.indexOf(healthMap.get(b.id)!);
  });

  const total = vessels.length;
  const overdue = vessels.filter(v => healthMap.get(v.id) === "overdue").length;
  const dueSoon = vessels.filter(v => healthMap.get(v.id) === "due_soon").length;
  const healthy = vessels.filter(v => healthMap.get(v.id) === "healthy").length;

  const healthDot: Record<HealthStatus, string> = {
    overdue:  "bg-red-500",
    due_soon: "bg-amber-400",
    healthy:  "bg-emerald-500",
    unknown:  "bg-slate-300",
  };

  const healthLabel: Record<HealthStatus, string> = {
    overdue:  "Overdue",
    due_soon: "Due Soon",
    healthy:  "Healthy",
    unknown:  "No Data",
  };

  const healthTextCls: Record<HealthStatus, string> = {
    overdue:  "text-red-600",
    due_soon: "text-amber-600",
    healthy:  "text-emerald-600",
    unknown:  "text-slate-400",
  };

  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        {/* Top bar */}
        <div className="bg-[#eceef1] border-b border-[#dcdee3] px-4 md:px-8 py-4 md:py-5 flex items-center gap-3">
          <h1 className="text-[#1E2938] text-lg md:text-xl font-bold tracking-tight flex-1">Vessels</h1>
          <span className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-sm font-semibold bg-slate-200 text-slate-600">
            {total} total
          </span>
        </div>

        <div className="flex-1 px-4 md:px-8 py-6 flex flex-col gap-5 pb-24 md:pb-6">

          {/* Summary metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#F1F2F5] neu-card rounded-md p-4 flex flex-col gap-1">
              <span className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">Total</span>
              <span className="text-2xl font-bold text-slate-800">{total}</span>
              <span className="text-xs text-slate-500">managed vessels</span>
            </div>
            <div className="bg-[#F1F2F5] neu-card rounded-md p-4 flex flex-col gap-1">
              <span className="text-[10px] tracking-widest uppercase text-red-400 font-medium">Overdue</span>
              <span className="text-2xl font-bold text-red-600">{overdue}</span>
              <span className="text-xs text-slate-500">need service now</span>
            </div>
            <div className="bg-[#F1F2F5] neu-card rounded-md p-4 flex flex-col gap-1">
              <span className="text-[10px] tracking-widest uppercase text-amber-500 font-medium">Due Soon</span>
              <span className="text-2xl font-bold text-amber-600">{dueSoon}</span>
              <span className="text-xs text-slate-500">approaching interval</span>
            </div>
            <div className="bg-[#F1F2F5] neu-card rounded-md p-4 flex flex-col gap-1">
              <span className="text-[10px] tracking-widest uppercase text-emerald-500 font-medium">Healthy</span>
              <span className="text-2xl font-bold text-emerald-600">{healthy}</span>
              <span className="text-xs text-slate-500">up to date</span>
            </div>
          </div>

          {/* Vessel list */}
          <div className="bg-[#F1F2F5] neu-card rounded-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-slate-800 text-sm font-semibold">All Vessels</h3>
              <span className="text-slate-400 text-[11px]">sorted by service urgency</span>
            </div>

            {sorted.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                No vessels on file yet. Add vessels from a contact profile.
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-6 py-3 text-[10px] tracking-widest uppercase text-slate-400 font-semibold">Vessel</th>
                        <th className="text-left px-4 py-3 text-[10px] tracking-widest uppercase text-slate-400 font-semibold">Owner</th>
                        <th className="text-left px-4 py-3 text-[10px] tracking-widest uppercase text-slate-400 font-semibold">Year / Length</th>
                        <th className="text-left px-4 py-3 text-[10px] tracking-widest uppercase text-slate-400 font-semibold">Health</th>
                        <th className="text-left px-4 py-3 text-[10px] tracking-widest uppercase text-slate-400 font-semibold">Next Service</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((vessel) => {
                        const status = healthMap.get(vessel.id) ?? "unknown";
                        const due = nextDueService(vessel);
                        const ownerId = vessel.contacts?.id;
                        const ownerName = vessel.contacts?.name ?? "Unknown";
                        return (
                          <tr key={vessel.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                            <td className="px-6 py-3.5">
                              <div className="font-medium text-slate-800">
                                {vessel.make_model ?? vessel.name ?? "Unnamed"}
                              </div>
                              {vessel.name && vessel.make_model && (
                                <div className="text-[11px] text-slate-400 mt-0.5">{vessel.name}</div>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {ownerId ? (
                                <Link href={`/pro/contacts/${ownerId}`} className="text-[#000080] hover:underline text-sm">
                                  {ownerName}
                                </Link>
                              ) : (
                                <span className="text-slate-400 text-sm">{ownerName}</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 text-sm">
                              {[vessel.year, vessel.length_ft || null].filter(Boolean).join(" / ") || "--"}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${healthDot[status]}`} />
                                <span className={`text-xs font-medium ${healthTextCls[status]}`}>{healthLabel[status]}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              {due ? (
                                <div>
                                  <div className="text-sm text-slate-700">{due.name}</div>
                                  <div className={`text-[11px] mt-0.5 ${healthTextCls[status]}`}>{due.daysAgo}d since last service</div>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">No schedule set</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card stack */}
                <div className="md:hidden flex flex-col divide-y divide-slate-100">
                  {sorted.map((vessel) => {
                    const status = healthMap.get(vessel.id) ?? "unknown";
                    const due = nextDueService(vessel);
                    const ownerId = vessel.contacts?.id;
                    const ownerName = vessel.contacts?.name ?? "Unknown";
                    const href = ownerId ? `/pro/contacts/${ownerId}` : "#";
                    return (
                      <Link key={vessel.id} href={href} className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                        <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${healthDot[status]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800 text-sm truncate">
                            {vessel.make_model ?? vessel.name ?? "Unnamed"}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{ownerName}</div>
                          {due && (
                            <div className={`text-xs mt-1 ${healthTextCls[status]}`}>
                              {due.name}: {due.daysAgo}d since last service
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-[11px] font-semibold ${healthTextCls[status]}`}>{healthLabel[status]}</div>
                          {(vessel.year || vessel.length_ft) && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {[vessel.year, vessel.length_ft || null].filter(Boolean).join(" / ")}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </ProShell>
  );
}
