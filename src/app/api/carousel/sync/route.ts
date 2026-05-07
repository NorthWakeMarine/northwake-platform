import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  const authClient = await createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // List all files in the carousel bucket
  const { data: files, error: listErr } = await supabase.storage.from("carousel").list("", { limit: 1000 });
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

  // Get all storage_paths already in the DB
  const { data: existing } = await supabase.from("carousel_images").select("storage_path, display_order");
  const knownPaths = new Set((existing ?? []).map((r) => r.storage_path));
  const maxOrder = Math.max(0, ...(existing ?? []).map((r) => r.display_order ?? 0));

  const imageExts = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);
  const toInsert = (files ?? []).filter((f) => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    return imageExts.has(ext) && !knownPaths.has(f.name);
  });

  if (toInsert.length === 0) return NextResponse.json({ ok: true, imported: 0 });

  const rows = toInsert.map((f, i) => {
    const { data: { publicUrl } } = supabase.storage.from("carousel").getPublicUrl(f.name);
    return {
      storage_path: f.name,
      public_url: publicUrl,
      display_order: maxOrder + i + 1,
      focal_x: 50,
      focal_y: 50,
      active: true,
    };
  });

  const { data: inserted, error: insertErr } = await supabase
    .from("carousel_images")
    .insert(rows)
    .select();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, imported: inserted?.length ?? 0, images: inserted });
}
