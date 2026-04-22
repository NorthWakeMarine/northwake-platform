import ProShell from "@/components/ProShell";

type Integration = {
  id: string;
  name: string;
  description: string;
  detail: string;
  status: "connected" | "not_connected" | "error";
  icon: string;
};

const integrations: Integration[] = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Appointment & scheduling sync",
    detail: "Automatically push booked jobs to your Google Calendar and pull availability when scheduling new services.",
    status: "not_connected",
    icon: "GC",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Invoice sync and conflict detection",
    detail: "Pull invoice dates from QuickBooks and compare against service records to flag billing mismatches automatically.",
    status: "not_connected",
    icon: "QB",
  },
  {
    id: "dialpad",
    name: "Dialpad",
    description: "Call logging and contact sync",
    detail: "Log inbound and outbound calls against contact records and auto-create leads from new caller IDs.",
    status: "not_connected",
    icon: "DP",
  },
];

const statusConfig = {
  connected: {
    dot: "bg-emerald-500",
    label: "Connected",
    cls: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  },
  not_connected: {
    dot: "bg-slate-300",
    label: "Not Connected",
    cls: "bg-slate-100 text-slate-500 border border-slate-200",
  },
  error: {
    dot: "bg-red-500",
    label: "Error",
    cls: "bg-red-50 text-red-600 border border-red-200",
  },
};

export default function IntegrationsPage() {
  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        <div className="bg-white border-b border-slate-200 px-8 py-5">
          <h1 className="text-slate-900 text-xl font-bold tracking-tight">Integrations</h1>
          <p className="text-slate-400 text-xs mt-0.5">Manage connections to external services.</p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map((intg) => {
              const cfg = statusConfig[intg.status];
              return (
                <div key={intg.id} className="bg-white border border-slate-200 rounded-sm p-6 flex flex-col gap-4">

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-sm flex items-center justify-center shrink-0">
                        <span className="text-slate-500 text-[10px] font-bold tracking-wider">{intg.icon}</span>
                      </div>
                      <div>
                        <h2 className="text-slate-800 text-sm font-semibold">{intg.name}</h2>
                        <p className="text-slate-400 text-[10px] tracking-wide mt-0.5">{intg.description}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm flex items-center gap-1.5 whitespace-nowrap font-medium ${cfg.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} aria-hidden="true" />
                      {cfg.label}
                    </span>
                  </div>

                  <p className="text-slate-500 text-xs leading-relaxed flex-1">{intg.detail}</p>

                  <button
                    disabled
                    className="w-full border border-slate-200 text-slate-400 text-[10px] tracking-widest uppercase py-2.5 rounded-sm cursor-not-allowed font-medium"
                    title="Coming soon — OAuth credentials required"
                  >
                    {intg.status === "connected" ? "Manage" : "Connect"}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            Integration setup requires OAuth credentials. Contact your developer to configure each connection.
          </p>
        </div>
      </div>
    </ProShell>
  );
}
