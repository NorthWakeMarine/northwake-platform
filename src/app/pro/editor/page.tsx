import { createServerSupabase } from "@/lib/supabase/server";
import EditorClient from "./EditorClient";

export default async function EditorPage() {
  const supabase = await createServerSupabase();
  const { data: items } = await supabase
    .from("site_content")
    .select("id, key, value, description")
    .order("key");

  return <EditorClient items={items ?? []} />;
}
