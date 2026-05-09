import { createClient } from "@supabase/supabase-js";
import WaiverForm from "./WaiverForm";
import { clientConfig } from "@/config/client";

type SearchParams = Promise<{ contact_id?: string }>;

async function getContactPrefill(contact_id: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const { data } = await supabase
      .from("contacts")
      .select("name, email, phone")
      .eq("id", contact_id)
      .single();
    return data ?? null;
  } catch {
    return null;
  }
}

export const metadata = {
  title: `Liability Waiver & Service Agreement | ${clientConfig.companyName}`,
  description: `${clientConfig.companyName} General Liability Waiver and Service Agreement. Please read and complete this form carefully before participation.`,
  robots: { index: false, follow: false },
};

export default async function LiabilityWaiverPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { contact_id } = await searchParams;
  const prefill = contact_id ? await getContactPrefill(contact_id) : null;

  return (
    <WaiverForm
      contactId={contact_id}
      prefill={prefill ?? undefined}
    />
  );
}
