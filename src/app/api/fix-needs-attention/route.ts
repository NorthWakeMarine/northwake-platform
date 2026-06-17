import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { PipelineStage } from "@/types/pipeline";

// POST /api/fix-needs-attention
// One-time cleanup for contacts the old integrity check stranded in the
// deprecated `needs_attention` stage (their real stage was overwritten and
// lost). We re-derive a sensible stage from their QuickBooks activity in the
// timeline, mirroring the QB webhook's own logic (paid invoice -> done_invoiced).
// Health flags are left intact, so each card still shows its amber warning.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

function inferStage(events: { event_type: string | null; metadata: Record<string, unknown> | null }[]): PipelineStage {
  const isPaid = events.some(
    (e) => e.event_type === "payment" ||
      (e.event_type === "invoice" && String((e.metadata ?? {}).status ?? "").toLowerCase() === "paid")
  );
  if (isPaid) return "done_invoiced";
  if (events.some((e) => e.event_type === "invoice")) return "done_invoiced";
  if (events.some((e) => e.event_type === "estimate")) return "estimate_sent";
  return "new_leads";
}

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { createClient } = await import("@supabase/supabase-js");
  const supa: AnySupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: stuck } = await supa
    .from("contacts")
    .select("id, name")
    .eq("pipeline_stage", "needs_attention");

  const rows = (stuck ?? []) as { id: string; name: string | null }[];
  const moved: { name: string | null; to: PipelineStage }[] = [];

  let i = 0;
  async function worker() {
    while (i < rows.length) {
      const c = rows[i++];
      const { data: events } = await supa
        .from("timeline_events")
        .select("event_type, metadata")
        .eq("contact_id", c.id);
      const stage = inferStage(events ?? []);
      await supa
        .from("contacts")
        .update({ pipeline_stage: stage, stage_entered_at: new Date().toISOString() })
        .eq("id", c.id);
      moved.push({ name: c.name, to: stage });
    }
  }
  await Promise.all(Array.from({ length: 10 }, worker));

  return NextResponse.json({ count: moved.length, moved });
}
