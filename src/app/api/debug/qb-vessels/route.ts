import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { getQbCustomerFull, extractQbVesselFields, getQbTokens } = await import("@/lib/quickbooks");

  const tokens = await getQbTokens();
  if (!tokens) return NextResponse.json({ error: "QB not connected" });

  // Test against first 3 linked contacts
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const { data: contacts } = await db
    .from("contacts")
    .select("id, name, qb_customer_id")
    .not("qb_customer_id", "is", null)
    .limit(3);

  const results = [];
  for (const c of contacts ?? []) {
    try {
      const customer = await getQbCustomerFull(c.qb_customer_id!);
      const parsed = extractQbVesselFields(customer);
      results.push({
        name: c.name,
        qbId: c.qb_customer_id,
        rawCustomFields: customer.CustomField ?? [],
        parsedVessels: parsed,
        // Show all top-level keys so we can find where QB put the custom fields
        allKeys: Object.keys(customer),
        fullRaw: customer,
      });
    } catch (e) {
      results.push({ name: c.name, qbId: c.qb_customer_id, error: String(e) });
    }
  }

  return NextResponse.json(results);
}
