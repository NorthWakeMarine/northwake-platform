import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import CalendarRegisterButton from "./IntegrationsClient";

export const dynamic = "force-dynamic";

async function getCalendarStatus(): Promise<{ connected: boolean; webhookExpiry: string | null }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Check webhook expiry from system_flags
  let webhookExpiry: string | null = null;
  try {
    const { data } = await supabase
      .from("system_flags")
      .select("message")
      .eq("flag_type", "calendar_webhook_channel")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    webhookExpiry = data?.message ?? null;
  } catch { /* ignore */ }

  // Verify the actual Google Calendar API is reachable regardless of flag state
  let connected = false;
  try {
    const { listUpcomingEvents } = await import("@/lib/google-calendar");
    await listUpcomingEvents(1);
    connected = true;
  } catch { /* not connected */ }

  return { connected, webhookExpiry };
}

function StatusBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="shrink-0 text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm flex items-center gap-1.5 whitespace-nowrap font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
      Connected
    </span>
  ) : (
    <span className="shrink-0 text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm flex items-center gap-1.5 whitespace-nowrap font-medium bg-slate-100 text-slate-500 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
      Not Connected
    </span>
  );
}

export default async function IntegrationsPage() {
  const { connected: calendarConnected, webhookExpiry } = await getCalendarStatus();

  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        <div className="bg-white border-b border-slate-200 px-8 py-5">
          <h1 className="text-slate-900 text-xl font-bold tracking-tight">Integrations</h1>
          <p className="text-slate-400 text-xs mt-0.5">Manage connections to external services.</p>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Google Calendar */}
            <div className="bg-white border border-slate-200 rounded-sm p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-sm flex items-center justify-center shrink-0">
                    <span className="text-slate-500 text-[10px] font-bold tracking-wider">GC</span>
                  </div>
                  <div>
                    <h2 className="text-slate-800 text-sm font-semibold">Google Calendar</h2>
                    <p className="text-slate-400 text-[10px] tracking-wide mt-0.5">Appointment and scheduling sync</p>
                  </div>
                </div>
                <StatusBadge connected={calendarConnected} />
              </div>
              <p className="text-slate-500 text-xs leading-relaxed flex-1">
                Push booked jobs to Google Calendar in real time. Changes made on your phone sync back to the CRM automatically.
              </p>
              <CalendarRegisterButton expires={webhookExpiry} />
            </div>

            {/* QuickBooks */}
            <div className="bg-white border border-slate-200 rounded-sm p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-sm flex items-center justify-center shrink-0">
                    <span className="text-slate-500 text-[10px] font-bold tracking-wider">QB</span>
                  </div>
                  <div>
                    <h2 className="text-slate-800 text-sm font-semibold">QuickBooks</h2>
                    <p className="text-slate-400 text-[10px] tracking-wide mt-0.5">Invoice sync and auto-scheduling</p>
                  </div>
                </div>
                <StatusBadge connected={false} />
              </div>
              <p className="text-slate-500 text-xs leading-relaxed flex-1">
                Pull invoice data from QuickBooks and auto-schedule jobs on Google Calendar. Flags billing mismatches against service records.
              </p>
              <button
                disabled
                className="w-full border border-slate-200 text-slate-400 text-[10px] tracking-widest uppercase py-2.5 rounded-sm cursor-not-allowed font-medium"
              >
                Requires QB OAuth Credentials
              </button>
            </div>

            {/* Dialpad */}
            <div className="bg-white border border-slate-200 rounded-sm p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-sm flex items-center justify-center shrink-0">
                    <span className="text-slate-500 text-[10px] font-bold tracking-wider">DP</span>
                  </div>
                  <div>
                    <h2 className="text-slate-800 text-sm font-semibold">Dialpad</h2>
                    <p className="text-slate-400 text-[10px] tracking-wide mt-0.5">Call logging and lead capture</p>
                  </div>
                </div>
                <StatusBadge connected={false} />
              </div>
              <p className="text-slate-500 text-xs leading-relaxed flex-1">
                Log inbound and outbound calls against contact records. Inbound calls from unknown numbers auto-create a new lead.
              </p>
              <button
                disabled
                className="w-full border border-slate-200 text-slate-400 text-[10px] tracking-widest uppercase py-2.5 rounded-sm cursor-not-allowed font-medium"
              >
                Requires Dialpad Webhook Setup
              </button>
            </div>

          </div>
        </div>
      </div>
    </ProShell>
  );
}
