import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const authClient = await createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, focal_x, focal_y, display_order, active } = body as {
    id: string;
    focal_x?: number;
    focal_y?: number;
    display_order?: number;
    active?: boolean;
  };

  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const patch: Record<string, unknown> = {};
  if (focal_x !== undefined) patch.focal_x = focal_x;
  if (focal_y !== undefined) patch.focal_y = focal_y;
  if (display_order !== undefined) patch.display_order = display_order;
  if (active !== undefined) patch.active = active;

  const { error } = await supabase.from("carousel_images").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
