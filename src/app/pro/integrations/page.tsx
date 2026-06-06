import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import CalendarRegisterButton from "./IntegrationsClient";
import RegisterQuoWebhookButton from "./RegisterQuoWebhookButton";
import SyncPanel from "./SyncPanel";

export const dynamic = "force-dynamic";

async function getCalendarStatus(): Promise<{ connected: boolean; webhookExpiry: string | null }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

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

  let connected = false;
  try {
    const { listUpcomingEvents } = await import("@/lib/google-calendar");
    await listUpcomingEvents(1);
    connected = true;
  } catch { /* not connected */ }

  return { connected, webhookExpiry };
}

async function getOAuthStatus(): Promise<{ qb: { connected: boolean; realmId: string | null }; quo: { connected: boolean } }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data } = await supabase
    .from("oauth_tokens")
    .select("provider, realm_id, expires_at")
    .in("provider", ["quickbooks"]);

  const qbRow = data?.find((r) => r.provider === "quickbooks");

  return {
    qb: { connected: !!qbRow, realmId: qbRow?.realm_id ?? null },
    quo: { connected: !!process.env.QUO_API_KEY },
  };
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

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ qb_connected?: string; qb_error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { connected: calendarConnected, webhookExpiry } = await getCalendarStatus();
  const { qb, quo } = await getOAuthStatus();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? null;


  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        <div className="bg-[#eceef1] border-b border-[#dcdee3] px-8 py-5">
          <h1 className="text-[#1E2938] text-xl font-bold tracking-tight">Integrations</h1>
          <p className="text-[#1E2938]/50 text-sm mt-0.5">Manage connections to external services.</p>
        </div>

        {(params.qb_connected || params.qb_error) && (
          <div className="mx-8 mt-4">
            {params.qb_connected && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-2.5 text-emerald-700 text-xs font-medium">
                QuickBooks connected successfully.
              </div>
            )}
            {params.qb_error && (
              <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-2.5 text-red-700 text-xs font-medium">
                QuickBooks connection failed: {params.qb_error}. Check your credentials.
              </div>
            )}
          </div>
        )}

        <div className="px-8 py-6 flex flex-col gap-5">
          <SyncPanel qbConnected={qb.connected} quoConnected={quo.connected} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Google Calendar */}
            <div className="bg-[#F1F2F5] neu-card rounded-md p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/60 rounded-md flex items-center justify-center shrink-0">
                    <span className="text-slate-500 text-[10px] font-bold tracking-wider">GC</span>
                  </div>
                  <div>
                    <h2 className="text-[#1E2938] text-sm font-bold">Google Calendar</h2>
                    <p className="text-slate-400 text-[10px] tracking-wide mt-0.5">Scheduling and job management</p>
                  </div>
                </div>
                <StatusBadge connected={calendarConnected} />
              </div>
              <p className="text-slate-500 text-sm leading-relaxed flex-1">
                Schedule jobs, sync appointments, and manage your calendar from one place. Updates made on any device reflect in the CRM in real time.
              </p>
              <CalendarRegisterButton expires={webhookExpiry} calendarConnected={calendarConnected} />
            </div>

            {/* QuickBooks */}
            <div className="bg-[#F1F2F5] neu-card rounded-md p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/60 rounded-md flex items-center justify-center shrink-0">
                    <span className="text-slate-500 text-[10px] font-bold tracking-wider">QB</span>
                  </div>
                  <div>
                    <h2 className="text-[#1E2938] text-sm font-bold">QuickBooks</h2>
                    <p className="text-slate-400 text-[10px] tracking-wide mt-0.5">Invoicing, payments, and customer sync</p>
                  </div>
                </div>
                <StatusBadge connected={qb.connected} />
              </div>
              <p className="text-slate-500 text-sm leading-relaxed flex-1">
                Create and send invoices directly from contact records, sync customer data, and automatically move jobs to Done when payment is received.
              </p>
              {qb.connected ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Connected to company {qb.realmId}
                  </div>
                  <a
                    href="/api/auth/quickbooks"
                    className="w-full border border-slate-200 text-slate-500 text-[10px] tracking-widest uppercase py-2.5 rounded-sm font-medium hover:border-slate-300 transition-colors text-center"
                  >
                    Re-authorize
                  </a>
                </div>
              ) : (
                <a
                  href="/api/auth/quickbooks"
                  className="w-full bg-[#000080] text-white text-[10px] tracking-widest uppercase py-2.5 rounded-sm font-semibold hover:bg-blue-900 transition-colors text-center"
                >
                  Connect QuickBooks
                </a>
              )}
            </div>

            {/* Quo */}
            <div className="bg-[#F1F2F5] neu-card rounded-md p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/60 rounded-md flex items-center justify-center shrink-0">
                    <span className="text-slate-500 text-[10px] font-bold tracking-wider">QUO</span>
                  </div>
                  <div>
                    <h2 className="text-[#1E2938] text-sm font-bold">Quo</h2>
                    <p className="text-slate-400 text-[10px] tracking-wide mt-0.5">Call and text logging with lead capture</p>
                  </div>
                </div>
                <StatusBadge connected={quo.connected} />
              </div>
              <p className="text-slate-500 text-sm leading-relaxed flex-1">
                Every call and text is logged against the right contact automatically. Unknown callers become new leads, and recordings are stored on the timeline.
              </p>
              {quo.connected && (
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  API key connected
                </div>
              )}
              {!quo.connected && (
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Add QUO_API_KEY to Vercel environment variables to connect.
                </p>
              )}
              <RegisterQuoWebhookButton />
            </div>

            {/* Google Analytics */}
            <div className="bg-[#F1F2F5] neu-card rounded-md p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/60 rounded-md flex items-center justify-center shrink-0">
                    <span className="text-slate-500 text-[10px] font-bold tracking-wider">GA</span>
                  </div>
                  <div>
                    <h2 className="text-[#1E2938] text-sm font-bold">Google Analytics</h2>
                    <p className="text-slate-400 text-[10px] tracking-wide mt-0.5">Landing site analytics and event tracking</p>
                  </div>
                </div>
                <StatusBadge connected={!!gaId} />
              </div>
              <p className="text-slate-500 text-sm leading-relaxed flex-1">
                Tracks visitor behavior across the landing site, including page views, form submissions, CTA clicks, and phone or email interactions.
              </p>
              {gaId ? (
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  Measurement ID: {gaId}
                </div>
              ) : (
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Add NEXT_PUBLIC_GA_MEASUREMENT_ID to Vercel environment variables to activate.
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </ProShell>
  );
}
