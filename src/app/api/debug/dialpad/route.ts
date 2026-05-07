import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

const DP_BASE = "https://dialpad.com/api/v2";

async function rawRequest(path: string, token: string) {
  const res = await fetch(`${DP_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const body = await res.text();
  let parsed: unknown = body;
  try { parsed = JSON.parse(body); } catch { /* keep raw text */ }
  return { status: res.status, ok: res.ok, body: parsed };
}

export async function GET(req: NextRequest) {
  // Only accessible to authenticated pro users
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.DIALPAD_API_KEY;
  if (!token) return NextResponse.json({ error: "DIALPAD_API_KEY not set" }, { status: 500 });

  const [noType, company, local] = await Promise.all([
    rawRequest("/contacts?limit=5", token),
    rawRequest("/contacts?type=company&limit=5", token),
    rawRequest("/contacts?type=local&limit=5", token),
  ]);

  return NextResponse.json({ noType, company, local });
}
