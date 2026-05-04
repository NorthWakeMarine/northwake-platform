import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import CalendarRegisterButton from "./IntegrationsClient";

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

async function getOAuthStatus(): Promise<{ qb: { connected: boolean; realmId: string | null }; dialpad: { connected: boolean } }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data } = await supabase
    .from("oauth_tokens")
    .select("provider, realm_id, expires_at")
    .in("provider", ["quickbooks", "dialpad"]);

  const qbRow = data?.find((r) => r.provider === "quickbooks");
  const dpRow = data?.find((r) => r.provider === "dialpad");

  return {
    qb: { connected: !!qbRow, realmId: qbRow?.realm_id ?? null },
    dialpad: { connected: !!dpRow },
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
  searchParams?: Promise<{ qb_connected?: string; qb_error?: string; dp_connected?: string; dp_error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { connected: calendarConnected, webhookExpiry } = await getCalendarStatus();
  const { qb, dialpad } = await getOAuthStatus();


  return (
    <ProShell>
      <div className="flex-1 flex flex-col">

        <div className="bg-white border-b border-slate-200 px-8 py-5">
          <h1 className="text-slate-900 text-xl font-bold tracking-tight">Integrations</h1>
          <p className="text-slate-400 text-xs mt-0.5">Manage connections to external services.</p>
        </div>

        {(params.qb_connected || params.qb_error || params.dp_connected || params.dp_error) && (
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
            {params.dp_connected && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-2.5 text-emerald-700 text-xs font-medium">
                Dialpad connected successfully.
              </div>
            )}
            {params.dp_error && (
              <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-2.5 text-red-700 text-xs font-medium">
                Dialpad connection failed: {params.dp_error}. Check your credentials.
              </div>
            )}
          </div>
        )}

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
                    <p className="text-slate-400 text-[10px] tracking-wide mt-0.5">Invoice sync and financial mirror</p>
                  </div>
                </div>
                <StatusBadge connected={qb.connected} />
              </div>
              <p className="text-slate-500 text-xs leading-relaxed flex-1">
                Generate invoices in one click from asset cards. When a payment lands in QuickBooks, the contact moves to Done automatically.
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
                <StatusBadge connected={dialpad.connected} />
              </div>
              <p className="text-slate-500 text-xs leading-relaxed flex-1">
                Log inbound and outbound calls against contact records. Missed calls from unknown numbers auto-create a new lead with the voicemail transcript.
              </p>
              {dialpad.connected ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Webhook active
                  </div>
                  <p className="text-slate-400 text-[10px]">
                    Webhook URL: {process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/dialpad
                  </p>
                  <a
                    href="/api/auth/dialpad"
                    className="w-full border border-slate-200 text-slate-500 text-[10px] tracking-widest uppercase py-2.5 rounded-sm font-medium hover:border-slate-300 transition-colors text-center"
                  >
                    Re-authorize
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <a
                    href="/api/auth/dialpad"
                    className="w-full bg-[#000080] text-white text-[10px] tracking-widest uppercase py-2.5 rounded-sm font-semibold hover:bg-blue-900 transition-colors text-center"
                  >
                    Connect Dialpad
                  </a>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    After connecting, register the webhook in Dialpad: {process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/dialpad
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </ProShell>
  );
}
