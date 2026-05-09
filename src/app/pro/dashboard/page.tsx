export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import ProShell from "@/components/ProShell";
import PipelineBoard from "./PipelineBoard";
import { getPipelineBoard } from "@/lib/pipeline";

async function getDashboardStats(): Promise<{ newLeadsWeek: number; callsWeek: number }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [leadsRes, callsRes] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabase.from("timeline_events").select("id", { count: "exact", head: true }).eq("event_type", "call").gte("created_at", since),
    ]);
    return { newLeadsWeek: leadsRes.count ?? 0, callsWeek: callsRes.count ?? 0 };
  } catch {
    return { newLeadsWeek: 0, callsWeek: 0 };
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
