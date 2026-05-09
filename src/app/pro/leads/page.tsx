export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import ClickableRow from "@/components/ClickableRow";
import { clientConfig } from "@/config/client";

type Lead = {
  id: string;
  created_at: string;
  name: string | null;
  email: string;
  phone: string | null;
  vessel_type: string | null;
  vessel_length: string | null;
  service: string | null;
  source: string | null;
};

const sourceConfig: Record<string, { label: string; cls: string }> = {
  hero:       { label: "Home Form",    cls: "bg-blue-50 text-blue-600 border border-blue-200" },
  contact:    { label: "Contact Form", cls: "bg-blue-50 text-blue-600 border border-blue-200" },
  website:    { label: "Website",      cls: "bg-blue-50 text-blue-600 border border-blue-200" },
  waiver:     { label: "Waiver",       cls: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  api:        { label: "API",          cls: "bg-slate-100 text-slate-500 border border-slate-200" },
  dialpad:    { label: "Dialpad",      cls: "bg-purple-50 text-purple-600 border border-purple-200" },
  google_ads: { label: "Google Ads",   cls: "bg-green-50 text-green-600 border border-green-200" },
  manual:     { label: "Manual",       cls: "bg-amber-50 text-amber-600 border border-amber-200" },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const SORTABLE_COLS: Record<string, string> = {
  Date: "created_at",
  Name: "name",
  Email: "email",
  Phone: "phone",
};

function SortableHeader({ label, field, currentSort, currentDir }: {
  label: string;
  field: string | null;
  currentSort: string;
  currentDir: string;
}) {
  if (!field) {
    return (
      <th className="text-left text-slate-400 text-[10px] tracking-widest uppercase font-medium py-3 px-4 first:pl-6 last:pr-6 whitespace-nowrap">
        {label}
      </th>
    );
  }
  const isActive = currentSort === field;
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc";
  const params = new URLSearchParams({ sort: field, dir: nextDir }).toString();
  return (
    <th className="text-left text-slate-400 text-[10px] tracking-widest uppercase font-medium py-3 px-4 first:pl-6 last:pr-6 whitespace-nowrap">
      <a href={`?${params}`} className={`flex items-center gap-1 hover:text-slate-600 transition-colors ${isActive ? "text-slate-600" : ""}`}>
        {label}
        {isActive && <span className="text-slate-400">{currentDir === "asc" ? "↑" : "↓"}</span>}
      </a>
    </th>
  );
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string; dir?: string }>;
}) {
  const { sort, dir } = (await searchParams) ?? {};
  const sortField = Object.values(SORTABLE_COLS).includes(sort ?? "") ? (sort ?? "created_at") : "created_at";
  const sortDir = dir === "asc" ? "asc" : "desc";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, created_at, name, email, phone, vessel_type, vessel_length, service, source")
    .order(sortField, { ascending: sortDir === "asc" });

  const total = leads?.length ?? 0;
  const thisMonth = leads?.filter((l) => {
    const d = new Date(l.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length ?? 0;

  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-slate-900 text-xl font-bold tracking-tight">Leads</h1>
            <p className="text-slate-400 text-xs mt-0.5">Every lead received across all sources.</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span><strong className="text-slate-800">{total}</strong> total</span>
            <span><strong className="text-slate-800">{thisMonth}</strong> this month</span>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="bg-white border border-slate-200 rounded-sm">

            {error ? (
              <p className="text-red-500 text-xs px-6 py-6">Failed to load leads: {error.message}</p>
            ) : !leads || leads.length === 0 ? (
              <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
                <p className="text-slate-400 text-sm">No leads yet.</p>
                <p className="text-slate-300 text-xs max-w-xs leading-relaxed">
                  Leads appear here automatically when someone submits a quote request on the website. Share your contact page link to start receiving them.
                </p>
                <a
                  href={`${clientConfig.siteUrl}/contact`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] tracking-widest uppercase text-[#000080] font-semibold hover:underline mt-1"
                >
                  View Contact Page →
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {(["Date", "Name", "Email", "Phone", "Vessel", "Service", "Source"] as const).map((h) => (
                        <SortableHeader
                          key={h}
                          label={h}
                          field={SORTABLE_COLS[h] ?? null}
                          currentSort={sortField}
                          currentDir={sortDir}
                        />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(leads as Lead[]).map((lead) => {
                      const src = sourceConfig[lead.source ?? "website"] ?? sourceConfig.website;
                      return (
                        <ClickableRow key={lead.id} href={`/pro/leads/${lead.id}`} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                          <td className="py-3 px-4 first:pl-6 text-slate-400 whitespace-nowrap">{fmt(lead.created_at)}</td>
                          <td className="py-3 px-4 text-slate-800 font-medium whitespace-nowrap">{lead.name || <span className="text-slate-300">—</span>}</td>
                          <td className="py-3 px-4 text-slate-500">
                            <a href={`mailto:${lead.email}`} className="hover:text-blue-600 transition-colors">{lead.email}</a>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {lead.phone
                              ? <a href={`tel:${lead.phone}`} className="hover:text-blue-600 transition-colors">{lead.phone}</a>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {lead.vessel_type
                              ? <>{lead.vessel_type}{lead.vessel_length ? <span className="text-slate-400"> · {lead.vessel_length} ft</span> : null}</>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{lead.service || <span className="text-slate-300">—</span>}</td>
                          <td className="py-3 px-4 last:pr-6 whitespace-nowrap">
                            <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium ${src.cls}`}>
                              {src.label}
                            </span>
                          </td>
                        </ClickableRow>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </ProShell>
  );
}
