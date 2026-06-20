export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProShell from "@/components/ProShell";
import SettingsClient from "./SettingsClient";

export type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: string;
  lastSignIn: string | null;
};

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/pro");
  const callerRole = (user.app_metadata?.role as string) ?? "admin";
  if (callerRole !== "admin") redirect("/pro/contacts");

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 100 });

  const members: TeamMember[] = users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    name: ((u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Unknown") as string),
    role: (u.app_metadata?.role as string) ?? "admin",
    lastSignIn: u.last_sign_in_at ?? null,
  }));

  return (
    <ProShell>
      <SettingsClient members={members} />
    </ProShell>
  );
}
