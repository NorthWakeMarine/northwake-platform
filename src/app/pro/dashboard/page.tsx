export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import PipelineBoard from "./PipelineBoard";
import { getPipelineBoard } from "@/lib/pipeline";

async function getDashboardStats(): Promise<{ newLeadsWeek: number; callsWeek: number; totalContacts: number; convertedMonth: number }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [leadsRes, callsRes, contactsRes, convertedRes] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", since7d),
      supabase.from("timeline_events").select("id", { count: "exact", head: true }).eq("event_type", "call").gte("created_at", since7d),
      supabase.from("contacts").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "converted").gte("updated_at", since30d),
    ]);
    return {
      newLeadsWeek: leadsRes.count ?? 0,
      callsWeek: callsRes.count ?? 0,
      totalContacts: contactsRes.count ?? 0,
      convertedMonth: convertedRes.count ?? 0,
    };
  } catch {
    return { newLeadsWeek: 0, callsWeek: 0, totalContacts: 0, convertedMonth: 0 };
  }
}

export default async function ProDashboardPage() {
  const [cards, stats] = await Promise.all([getPipelineBoard(), getDashboardStats()]);
  return (
    <ProShell>
      <PipelineBoard initialCards={cards} stats={stats} />
    </ProShell>
  );
}
