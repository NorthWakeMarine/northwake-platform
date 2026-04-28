import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import DeleteLeadButton from "./DeleteLeadButton";

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

export default async function LeadsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, created_at, name, email, phone, vessel_type, vessel_length, service, source")
    .order("created_at", { ascending: false });

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
              <p className="text-slate-400 text-sm px-6 py-10 text-center">No leads yet. They will appear here as they come in.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Date", "Name", "Email", "Phone", "Vessel", "Service", "Source", ""].map((h) => (
                        <th key={h} className="text-left text-slate-400 text-[10px] tracking-widest uppercase font-medium py-3 px-4 first:pl-6 last:pr-6 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(leads as Lead[]).map((lead) => {
                      const src = sourceConfig[lead.source ?? "website"] ?? sourceConfig.website;
                      return (
                        <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
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
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm font-medium ${src.cls}`}>
                              {src.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 last:pr-6">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/pro/leads/${lead.id}`}
                                className="text-[10px] tracking-widest uppercase text-blue-500 hover:text-blue-700 font-medium transition-colors whitespace-nowrap"
                              >
                                View
                              </Link>
                              <DeleteLeadButton leadId={lead.id} />
                            </div>
                          </td>
                        </tr>
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
