import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

export type IngestPayload = {
  name?: string;
  email?: string;
  phone?: string;
  vessel_type?: string;
  vessel_length?: string;
  source?: string;
  event_type?: string;
  event_title?: string;
  event_body?: string;
  metadata?: Record<string, unknown>;
};

export async function ingestContact(
  payload: IngestPayload
): Promise<{ contact_id: string; created: boolean }> {
  const supabase = serviceClient();

  // Look up existing contact by email first, then phone
  let contact: { id: string } | null = null;

  if (payload.email) {
    const { data } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", payload.email)
      .maybeSingle();
    contact = data;
  }

  if (!contact && payload.phone) {
    const { data } = await supabase
      .from("contacts")
      .select("id")
      .eq("phone", payload.phone)
      .maybeSingle();
    contact = data;
  }

  let created = false;

  if (contact) {
    // Merge any new data onto existing record
    const updates: Record<string, unknown> = {};
    if (payload.name) updates.name = payload.name;
    if (payload.phone) updates.phone = payload.phone;
    if (payload.vessel_type) updates.vessel_type = payload.vessel_type;
    if (payload.vessel_length) updates.vessel_length = payload.vessel_length;

    if (Object.keys(updates).length > 0) {
      await supabase.from("contacts").update(updates).eq("id", contact.id);
    }
  } else {
    const { data: newContact, error } = await supabase
      .from("contacts")
      .insert({
        name: payload.name ?? null,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        vessel_type: payload.vessel_type ?? null,
        vessel_length: payload.vessel_length ?? null,
        source: payload.source ?? "website",
        status: "lead",
      })
      .select("id")
      .single();

    if (error || !newContact) throw new Error(error?.message ?? "Failed to create contact");
    contact = newContact;
    created = true;
  }

  const eventType = payload.event_type ?? (created ? "lead_created" : "form_submission");
  const eventTitle = payload.event_title ?? (created ? "Lead created" : "New form submission");

  await supabase.from("timeline_events").insert({
    contact_id: contact.id,
    event_type: eventType,
    title: eventTitle,
    body: payload.event_body ?? null,
    metadata: payload.metadata ?? null,
    created_by: "system",
  });

  return { contact_id: contact.id, created };
}
