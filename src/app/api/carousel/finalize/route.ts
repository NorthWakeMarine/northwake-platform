import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const authClient = await createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { storagePath, publicUrl } = await req.json();
  if (!storagePath || !publicUrl) {
    return NextResponse.json({ error: "Missing storagePath or publicUrl." }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: last } = await supabase
    .from("carousel_images")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = ((last?.display_order as number) ?? 0) + 1;

  const { data: row, error: insertErr } = await supabase
    .from("carousel_images")
    .insert({
      storage_path: storagePath,
      public_url: publicUrl,
      display_order: nextOrder,
      focal_x: 50,
      focal_y: 50,
      active: true,
    })
    .select()
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, image: row });
}
