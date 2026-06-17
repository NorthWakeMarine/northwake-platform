import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { normalizePhone } from "@/lib/phone";

// POST /api/backfill-phones
// One-time cleanup: canonicalize every stored phone (contacts, linked_contacts,
// leads) to E.164 so known callers match instead of generating duplicate leads.
// Idempotent — rows already in E.164 are left untouched.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

async function backfillTable(
  supa: AnySupabase,
  table: string
): Promise<{ scanned: number; updated: number }> {
  const { data } = await supa.from(table).select("id, phone");
  const rows = (data ?? []) as { id: string; phone: string | null }[];
  let updated = 0;
  let i = 0;
  async function worker() {
    while (i < rows.length) {
      const row = rows[i++];
      const normalized = normalizePhone(row.phone);
      if (normalized && normalized !== row.phone) {
        await supa.from(table).update({ phone: normalized }).eq("id", row.id);
        updated++;
      }
    }
  }
  await Promise.all(Array.from({ length: 10 }, worker));
  return { scanned: rows.length, updated };
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
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const contacts = await backfillTable(supa, "contacts");
  const linked = await backfillTable(supa, "linked_contacts");
  const leads = await backfillTable(supa, "leads");

  return NextResponse.json({ contacts, linked, leads });
}
