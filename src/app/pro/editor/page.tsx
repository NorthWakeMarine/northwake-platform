import { createServerSupabase } from "@/lib/supabase/server";
import EditorClient from "./EditorClient";
import type { CarouselImage } from "./CarouselManager";

export default async function EditorPage() {
  const supabase = await createServerSupabase();

  const [{ data: items }, { data: carouselImages }] = await Promise.all([
    supabase.from("site_content").select("id, key, value, description").order("key"),
    supabase
      .from("carousel_images")
      .select("id, storage_path, public_url, display_order, focal_x, focal_y, active")
      .order("display_order"),
  ]);

  return (
    <EditorClient
      items={items ?? []}
      carouselImages={(carouselImages ?? []) as CarouselImage[]}
    />
  );
}
