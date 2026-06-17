"use server";

import { z } from "zod"; // noop: force cache bust after ServicesClient.tsx was added to repo
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { ingestContact } from "@/lib/ingest";
import { sendLeadNotification, sendWaiverCompletionNotification } from "@/lib/gmail";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { clientConfig } from "@/config/client";

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const parsed = parsePhoneNumberFromString(raw, "US");
  return parsed?.isValid() ? parsed.format("E.164") : raw.trim() || null;
}

// Run fn on each item with at most `concurrency` in-flight at once
async function pMap<T, R>(items: T[], fn: (item: T) => Promise<R>, concurrency: number): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

// ─── Lead Submission ──────────────────────────────────────────────────────────

const leadSchema = z.object({
  name:            z.string().optional(),
  first_name:      z.string().optional(),
  last_name:       z.string().optional(),
  email:           z.string().email("Please enter a valid email address."),
  phone:           z.string().optional(),
  vessel_length:   z.string().optional(),
  vessel_type:     z.string().min(1, "Please select a vessel type."),
  service:         z.string().min(1, "Please select a service."),
  referral_source: z.string().optional(),
  message:         z.string().optional(),
  comments:        z.string().optional(),
  source:          z.string().optional(),
});

export type LeadFormState = {
  success: boolean;
  error?: string;
};

export async function submitLead(
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = leadSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const d = parsed.data;
  const name =
    d.name ||
    [d.first_name, d.last_name].filter(Boolean).join(" ") ||
    "";

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("leads").insert({
    name,
    email:           d.email,
    phone:           normalizePhone(d.phone),
    vessel_length:   d.vessel_length   || null,
    vessel_type:     d.vessel_type,
    service:         d.service,
    referral_source: d.referral_source || null,
    message:         d.message || d.comments || null,
    source:          d.source          || "website",
  });

  if (error) {
    console.error("Lead insert error:", error.message, error.code, error.details);
    return { success: false, error: error.message };
  }

  // Mirror into contacts table via ingest (fire-and-forget, non-blocking)
  ingestContact({
    name,
    email: d.email,
    phone: normalizePhone(d.phone) ?? undefined,
    vessel_type: d.vessel_type,
    vessel_length: d.vessel_length ?? undefined,
    source: d.source ?? "website",
    event_type: "form_submission",
    event_title: `Quote request: ${d.service}`,
    metadata: { service: d.service, vessel_type: d.vessel_type },
  }).catch((err) => console.error("Ingest error:", err));

  // Email notification (fire-and-forget)
  sendLeadNotification({
    name,
    email: d.email ?? null,
    phone: d.phone ?? null,
    service: d.service ?? null,
    vesselType: d.vessel_type ?? null,
    message: d.message ?? d.comments ?? null,
  }).catch((err) => console.error("Lead email error:", err));

  return { success: true };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type LoginState = { error?: string };

// In-process rate limiting — swap for Upstash Redis on distributed infra
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 15 * 60 * 1000;

function getClientIp(h: Awaited<ReturnType<typeof headers>>): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const rec = loginAttempts.get(ip);
  if (!rec) return false;
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) return true;
  if (rec.lockedUntil && Date.now() >= rec.lockedUntil) loginAttempts.delete(ip);
  return false;
}

function recordFailure(ip: string) {
  const rec = loginAttempts.get(ip) ?? { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) rec.lockedUntil = Date.now() + LOCKOUT_MS;
  loginAttempts.set(ip, rec);
}

async function secureDelay() {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 200));
}

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const headersList = await headers();
  const ip = getClientIp(headersList);

  if (isRateLimited(ip)) {
    await secureDelay();
    return { error: "Too many sign-in attempts. Please wait 15 minutes." };
  }

  const email    = formData.get("email");
  const password = formData.get("password");
  const redirectTo = (formData.get("redirectTo") as string | null) || "/pro/pipeline";
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/pro/pipeline";

  if (
    typeof email    !== "string" || !email    ||
    typeof password !== "string" || !password ||
    email.length    > 256 ||
    password.length > 128
  ) {
    await secureDelay();
    recordFailure(ip);
    return { error: "Invalid credentials." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await secureDelay();
    recordFailure(ip);
    return { error: "Invalid credentials." };
  }

  redirect(safeRedirect);
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/pro");
}

// ─── CMS ─────────────────────────────────────────────────────────────────────

export type ContentUpdateState = { success?: boolean; error?: string };

export async function updateSiteContent(
  _prev: ContentUpdateState,
  formData: FormData
): Promise<ContentUpdateState> {
  const key   = formData.get("key")   as string;
  const value = formData.get("value") as string;

  if (!key) return { error: "Invalid key." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("site_content")
    .upsert({ key, value }, { onConflict: "key" });

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/pro/editor");
  return { success: true };
}

// ─── Timeline Notes ───────────────────────────────────────────────────────────

export type NoteState = { success?: boolean; error?: string };

export async function addLeadNote(
  _prev: NoteState,
  formData: FormData
): Promise<NoteState> {
  const lead_id   = formData.get("lead_id")    as string;
  const lead_phone = formData.get("lead_phone") as string | null;
  const lead_email = formData.get("lead_email") as string | null;
  const body = (formData.get("body") as string)?.trim();

  if (!lead_id) return { error: "Missing lead." };
  if (!body)    return { error: "Note cannot be empty." };

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.email?.split("@")[0] ?? "pro";

  const { error } = await supabase.from("timeline_events").insert({
    lead_id,
    event_type: "note",
    title: "Note added",
    body,
    created_by: username,
    metadata: {
      ...(lead_phone ? { lead_phone } : {}),
      ...(lead_email ? { lead_email } : {}),
    },
  });

  if (error) return { error: error.message };

  revalidatePath(`/pro/leads/${lead_id}`);
  return { success: true };
}

export async function addTimelineNote(
  _prev: NoteState,
  formData: FormData
): Promise<NoteState> {
  const contact_id = formData.get("contact_id") as string;
  const body = (formData.get("body") as string)?.trim();

  if (!contact_id) return { error: "Missing contact." };
  if (!body) return { error: "Note cannot be empty." };

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.email?.split("@")[0] ?? "pro";

  const { error } = await supabase.from("timeline_events").insert({
    contact_id,
    event_type: "note",
    title: "Note added",
    body,
    created_by: username,
  });

  if (error) return { error: error.message };

  revalidatePath(`/pro/contacts/${contact_id}`);
  return { success: true };
}

// ─── Phone Notes ──────────────────────────────────────────────────────────────

export async function createLeadFromCall(phone: string, name?: string): Promise<{ ok: boolean; error?: string }> {
  if (!phone) return { ok: false, error: "No phone number." };
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const { data: existing } = await supabase.from("leads").select("id").eq("phone", phone).maybeSingle();
  if (existing) return { ok: true }; // already a lead
  const { error } = await supabase.from("leads").insert({ phone, name: name?.trim() || null, source: "quo", email: "" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pro/leads");
  return { ok: true };
}

export type PhoneNoteState = { success?: boolean; error?: string };

export async function savePhoneNote(
  _prev: PhoneNoteState,
  formData: FormData
): Promise<PhoneNoteState> {
  const phone = (formData.get("phone") as string ?? "").trim();
  const note  = (formData.get("note")  as string ?? "").trim();
  if (!phone) return { error: "Missing phone number." };

  const supabase = await svc();
  const { error } = await supabase
    .from("phone_notes")
    .upsert({ phone, note, updated_at: new Date().toISOString() }, { onConflict: "phone" });

  if (error) return { error: error.message };

  revalidatePath("/pro/leads");
  return { success: true };
}

export async function updateTimelineNote(
  id: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  if (!body.trim()) return { ok: false, error: "Note cannot be empty." };

  const supabase = await createServerSupabase();

  const { data: existing } = await supabase
    .from("timeline_events")
    .select("metadata, contact_id")
    .eq("id", id)
    .single();

  const { data: { user } } = await supabase.auth.getUser();
  const editor = user?.email?.split("@")[0] ?? "pro";

  type EditEntry = { edited_at: string; edited_by: string };
  const prev = (existing?.metadata as Record<string, unknown> | null) ?? {};
  const editHistory: EditEntry[] = Array.isArray(prev.edit_history)
    ? [...(prev.edit_history as EditEntry[]), { edited_at: new Date().toISOString(), edited_by: editor }]
    : [{ edited_at: new Date().toISOString(), edited_by: editor }];

  const { error } = await supabase
    .from("timeline_events")
    .update({ body: body.trim(), metadata: { ...prev, edit_history: editHistory } })
    .eq("id", id)
    .eq("event_type", "note");

  if (error) return { ok: false, error: error.message };
  if (existing?.contact_id) revalidatePath(`/pro/contacts/${existing.contact_id}`);
  return { ok: true };
}

export async function deleteTimelineNote(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerSupabase();

  const { data: existing } = await supabase
    .from("timeline_events")
    .select("contact_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("timeline_events")
    .delete()
    .eq("id", id)
    .eq("event_type", "note");

  if (error) return { ok: false, error: error.message };
  if (existing?.contact_id) revalidatePath(`/pro/contacts/${existing.contact_id}`);
  return { ok: true };
}

export async function deleteTimelineEvent(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerSupabase();

  const { data: existing } = await supabase
    .from("timeline_events")
    .select("contact_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("timeline_events")
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  if (existing?.contact_id) revalidatePath(`/pro/contacts/${existing.contact_id}`);
  return { ok: true };
}

// ─── Waiver Submission ────────────────────────────────────────────────────────

export type WaiverState = { success?: boolean; error?: string };

export async function submitWaiver(
  _prev: WaiverState,
  formData: FormData
): Promise<WaiverState> {
  const name       = (formData.get("name")       as string)?.trim();
  const address    = (formData.get("address")    as string)?.trim();
  const phone      = normalizePhone((formData.get("phone") as string)?.trim()) ?? (formData.get("phone") as string)?.trim();
  const email      = (formData.get("email")      as string)?.trim();
  const boat       = (formData.get("boat")       as string)?.trim();
  const date       = (formData.get("date")       as string)?.trim();
  const signature  = (formData.get("signature")  as string)?.trim();
  const contact_id = (formData.get("contact_id") as string)?.trim() || null;
  const acknowledged = formData.get("acknowledged");

  if (!name || !address || !phone || !email || !boat || !date || !signature) {
    return { error: "All fields are required." };
  }
  if (!acknowledged) {
    return { error: "You must acknowledge the Release of Liability before submitting." };
  }

  // Use service client to bypass RLS on public submission
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  let id = contact_id;

  if (!id) {
    const { data: byEmail } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (byEmail) id = byEmail.id;
  }

  if (!id) {
    // Try exact match first, then fall back to last-10-digits to handle un-normalized stored numbers
    const { data: byPhone } = await supabase
      .from("contacts")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    if (byPhone) {
      id = byPhone.id;
    } else {
      const digits = phone?.replace(/\D/g, "").slice(-10);
      if (digits && digits.length === 10) {
        const { data: rows } = await supabase
          .from("contacts")
          .select("id")
          .ilike("phone", `%${digits}`)
          .limit(1);
        if (rows?.[0]) id = rows[0].id;
      }
    }
  }

  if (id) {
    const { error: updateErr } = await supabase
      .from("contacts")
      .update({ waiver_signed: true, name, phone, email, address })
      .eq("id", id);
    if (updateErr) console.error("Waiver contact update error:", updateErr.message);
  } else {
    const { data: newContact, error: createErr } = await supabase
      .from("contacts")
      .insert({ name, email, phone, address, source: "waiver", status: "lead", waiver_signed: true })
      .select("id")
      .single();
    if (createErr || !newContact) {
      console.error("Waiver contact insert error:", createErr?.message, createErr?.code, createErr?.details);
      return { error: createErr?.message ?? "Failed to save your waiver. Please try again." };
    }
    id = newContact.id;
  }

  await supabase.from("timeline_events").insert({
    contact_id: id,
    event_type: "waiver_signed",
    title: "Liability waiver signed",
    body: `Signed by ${name} on ${date}. Vessel: ${boat}. Address: ${address}.`,
    metadata: { name, address, phone, email, boat, date, signature },
    created_by: "customer",
  });

  // Auto-save waiver to Google Drive
  try {
    const { getOrCreateContactFolder, uploadFileToFolder } = await import("@/lib/google-drive");

    const { data: contactRow } = await supabase
      .from("contacts")
      .select("drive_folder_id, drive_folder_url")
      .eq("id", id)
      .single();

    let folderId = contactRow?.drive_folder_id as string | null;
    if (!folderId) {
      const folder = await getOrCreateContactFolder(name);
      folderId = folder.id;
      await supabase.from("contacts").update({
        drive_folder_id: folder.id,
        drive_folder_url: folder.url,
      }).eq("id", id);
    }

    const { generateWaiverPdf } = await import("@/lib/waiver-pdf");
    const pdfBuffer = await generateWaiverPdf({ name, address, phone, email, boat, date, signature });

    const fileName = `Waiver - ${name} - ${date}.pdf`;
    await uploadFileToFolder(folderId, fileName, "application/pdf", pdfBuffer);
  } catch (err) {
    console.error("Waiver Drive upload failed (non-fatal):", err);
  }

  // Email notification
  try {
    await sendWaiverCompletionNotification({ name, email, phone, address, boat, contactId: id! });
  } catch (err) {
    console.error("Waiver email notification failed (non-fatal):", err);
  }

  // Auto-sync to QuickBooks
  (async () => {
    try {
      const { findOrCreateQbCustomer, getQbTokens } = await import("@/lib/quickbooks");
      const tokens = await getQbTokens();
      if (!tokens) return;
      await findOrCreateQbCustomer({ id: id!, name, email, phone });
    } catch { /* non-fatal */ }
  })();

  // Auto-sync to OpenPhone (Quo)
  (async () => {
    try {
      const { data: contactRow } = await supabase
        .from("contacts")
        .select("openphone_contact_id")
        .eq("id", id)
        .single();
      if (!contactRow?.openphone_contact_id) return;
      const { updateOpenPhoneContact, splitName } = await import("@/lib/openphone");
      const { firstName, lastName } = splitName(name?.trim() ?? "");
      await updateOpenPhoneContact(contactRow.openphone_contact_id, {
        firstName,
        lastName: lastName || undefined,
        phoneNumbers: phone ? [{ name: "main", value: phone }] : [],
        emails: email ? [{ name: "main", value: email }] : [],
      });
    } catch { /* non-fatal */ }
  })();

  revalidatePath(`/pro/contacts/${id}`);
  return { success: true };
}

// ─── Lead Conversion ─────────────────────────────────────────────────────────

export type ConvertLeadState = { error?: string };

async function svc() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

async function insertVessel(
  supabase: Awaited<ReturnType<typeof svc>>,
  contactId: string,
  lead: { vessel_type?: string | null; vessel_length?: string | null; last_service_date?: string | null }
) {
  if (!lead.vessel_type && !lead.vessel_length) return;
  try {
    await supabase.from("vessels").insert({
      owner_id: contactId,
      asset_type: "vessel",
      vessel_type: lead.vessel_type ?? null,
      make_model: lead.vessel_type ?? null,
      length_ft: lead.vessel_length ?? null,
      last_service_date: lead.last_service_date ?? null,
    });
  } catch { /* vessels table may not exist yet */ }
}

// Check for duplicate contact by email or phone before converting
export type DuplicateCheckResult = {
  found: boolean;
  contact?: { id: string; name: string | null; email: string | null; phone: string | null };
  error?: string;
};

export async function checkDuplicateContact(leadId: string): Promise<DuplicateCheckResult> {
  const supabase = await svc();

  const { data: lead } = await supabase
    .from("leads")
    .select("email, phone")
    .eq("id", leadId)
    .single();

  if (!lead) return { found: false, error: "Lead not found." };

  const [byEmail, byPhone] = await Promise.all([
    lead.email
      ? supabase.from("contacts").select("id, name, email, phone").eq("email", lead.email).maybeSingle()
      : Promise.resolve({ data: null }),
    lead.phone
      ? supabase.from("contacts").select("id, name, email, phone").eq("phone", normalizePhone(lead.phone) ?? lead.phone).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const contact = byEmail.data ?? byPhone.data;

  return contact ? { found: true, contact } : { found: false };
}

// Convert lead to new contact profile (force_create skips duplicate lookup)
export async function convertLead(
  _prev: ConvertLeadState,
  formData: FormData
): Promise<ConvertLeadState> {
  const lead_id     = formData.get("lead_id")     as string;
  const force_create = formData.get("force_create") === "true";
  if (!lead_id) return { error: "Missing lead ID." };

  const supabase = await svc();

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, name, email, phone, vessel_type, vessel_length, source, waiver_signed, last_service_date")
    .eq("id", lead_id)
    .single();

  if (leadErr || !lead) return { error: "Lead not found." };

  // Fetch any phone note saved for this number
  let phoneNote: string | null = null;
  if (lead.phone) {
    const { data: pn } = await supabase
      .from("phone_notes")
      .select("note")
      .eq("phone", normalizePhone(lead.phone) ?? lead.phone)
      .maybeSingle();
    phoneNote = pn?.note?.trim() || null;
  }

  let contactId: string | null = null;

  if (!force_create) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id, notes")
      .eq("email", lead.email)
      .maybeSingle();
    if (existing) {
      contactId = existing.id;
      const mergedNotes = [existing.notes, phoneNote].filter(Boolean).join("\n\n---\n\n") || null;
      await supabase
        .from("contacts")
        .update({ name: lead.name, phone: normalizePhone(lead.phone), vessel_type: lead.vessel_type, vessel_length: lead.vessel_length, waiver_signed: lead.waiver_signed ?? false, status: "client", ...(mergedNotes !== null ? { notes: mergedNotes } : {}) })
        .eq("id", contactId);
    }
  }

  if (!contactId) {
    const { data: newContact, error: contactErr } = await supabase
      .from("contacts")
      .insert({ name: lead.name, email: lead.email, phone: normalizePhone(lead.phone), vessel_type: lead.vessel_type, vessel_length: lead.vessel_length, waiver_signed: lead.waiver_signed ?? false, source: lead.source ?? "website", status: "client", notes: phoneNote })
      .select("id")
      .single();
    if (contactErr || !newContact) return { error: contactErr?.message ?? "Failed to create contact." };
    contactId = newContact.id;
  }

  if (contactId) await insertVessel(supabase, contactId, lead);

  // Migrate any lead notes to the contact timeline
  await supabase
    .from("timeline_events")
    .update({ contact_id: contactId, lead_id: null })
    .eq("lead_id", lead_id)
    .eq("event_type", "note");

  await supabase.from("timeline_events").insert({
    contact_id: contactId,
    event_type: "lead_converted",
    title: "Converted to client",
    body: `Lead converted from source: ${lead.source ?? "website"}.`,
    created_by: "pro",
  });

  await supabase.from("leads").update({ status: "converted" }).eq("id", lead_id);

  revalidatePath(`/pro/leads/${lead_id}`);
  revalidatePath(`/pro/contacts/${contactId}`);
  redirect(`/pro/contacts/${contactId}`);
}

// Merge lead data into an existing contact, then delete the lead
export type MergeLeadState = { error?: string };

export async function mergeLead(
  _prev: MergeLeadState,
  formData: FormData
): Promise<MergeLeadState> {
  const lead_id    = formData.get("lead_id")    as string;
  const contact_id = formData.get("contact_id") as string;
  if (!lead_id || !contact_id) return { error: "Missing required fields." };

  const supabase = await svc();

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, name, phone, vessel_type, vessel_length, service, referral_source, message, source, waiver_signed, last_service_date")
    .eq("id", lead_id)
    .single();

  if (leadErr || !lead) return { error: "Lead not found." };

  // Fetch phone note and existing contact notes to merge
  let phoneNote: string | null = null;
  if (lead.phone) {
    const { data: pn } = await supabase
      .from("phone_notes")
      .select("note")
      .eq("phone", normalizePhone(lead.phone) ?? lead.phone)
      .maybeSingle();
    phoneNote = pn?.note?.trim() || null;
  }

  const { data: existingContact } = await supabase
    .from("contacts")
    .select("notes")
    .eq("id", contact_id)
    .maybeSingle();
  const mergedNotes = [existingContact?.notes, phoneNote].filter(Boolean).join("\n\n---\n\n") || null;

  // Patch any new info onto the existing contact
  await supabase
    .from("contacts")
    .update({
      ...(lead.name  ? { name: lead.name }   : {}),
      ...(lead.phone ? { phone: normalizePhone(lead.phone) ?? lead.phone } : {}),
      ...(lead.vessel_type   ? { vessel_type: lead.vessel_type }     : {}),
      ...(lead.vessel_length ? { vessel_length: lead.vessel_length } : {}),
      ...(lead.waiver_signed ? { waiver_signed: true }               : {}),
      ...(mergedNotes !== null ? { notes: mergedNotes } : {}),
      status: "client",
    })
    .eq("id", contact_id);

  await insertVessel(supabase, contact_id, lead);

  // Migrate any lead notes to the contact timeline
  await supabase
    .from("timeline_events")
    .update({ contact_id, lead_id: null })
    .eq("lead_id", lead_id)
    .eq("event_type", "note");

  // Log original lead as a web_lead timeline event
  await supabase.from("timeline_events").insert({
    contact_id,
    event_type: "web_lead",
    title: `Web lead merged — ${lead.service ?? "inquiry"}`,
    body: lead.message ?? `Service inquiry: ${lead.service ?? "not specified"}. Referral: ${lead.referral_source ?? "none"}.`,
    metadata: { lead_id, service: lead.service, source: lead.source, vessel_type: lead.vessel_type, vessel_length: lead.vessel_length, referral_source: lead.referral_source },
    created_by: "system",
  });

  // Delete the lead to keep the database clean
  await supabase.from("leads").delete().eq("id", lead_id);

  revalidatePath("/pro/leads");
  revalidatePath(`/pro/contacts/${contact_id}`);
  redirect(`/pro/contacts/${contact_id}`);
}

// ─── Fleet Assets ─────────────────────────────────────────────────────────────

export type AssetState = { error?: string; success?: boolean };

export async function addAsset(
  _prev: AssetState,
  formData: FormData
): Promise<AssetState> {
  const contact_id  = formData.get("contact_id")  as string;
  const asset_type  = (formData.get("asset_type") as string) || "vessel";
  const name        = (formData.get("name")        as string)?.trim() || null;
  const make_model  = (formData.get("make_model")  as string)?.trim() || null;
  const yearRaw     = formData.get("year") as string;
  const year        = yearRaw ? parseInt(yearRaw, 10) : null;
  const color       = (formData.get("color")       as string)?.trim() || null;
  const length_ft   = (formData.get("length_ft")   as string)?.trim().replace(/\s*ft\s*$/i, "") || null;
  const location    = (formData.get("location")    as string)?.trim() || null;
  const registration = (formData.get("registration") as string)?.trim() || null;
  const notes       = (formData.get("notes")       as string)?.trim() || null;
  const intervalRaw = formData.get("service_interval_days") as string;
  const service_interval_days = intervalRaw ? parseInt(intervalRaw, 10) : 90;

  if (!contact_id) return { error: "Missing contact." };

  const supabase = await svc();

  const { data: contactRow } = await supabase
    .from("contacts")
    .select("name, drive_folder_id, drive_folder_url")
    .eq("id", contact_id)
    .maybeSingle();
  const contactName = contactRow?.name ?? "Unknown";

  const { data: inserted, error } = await supabase.from("vessels").insert({
    owner_id: contact_id,
    asset_type,
    name,
    make_model,
    year: isNaN(year!) ? null : year,
    color,
    length_ft,
    location,
    registration,
    notes,
    service_interval_days: isNaN(service_interval_days) ? 90 : service_interval_days,
  }).select("id").single();

  if (error) return { error: error.message };

  try {
    const { getOrCreateContactFolder } = await import("@/lib/google-drive");
    const folder = await getOrCreateContactFolder(contactName);
    // Point the vessel at the shared contact folder
    await supabase.from("vessels").update({ drive_folder_url: folder.url }).eq("id", inserted.id);
    // Persist folder id/url on the contact if not already set
    if (!contactRow?.drive_folder_id) {
      await supabase.from("contacts").update({ drive_folder_id: folder.id, drive_folder_url: folder.url }).eq("id", contact_id);
    }
  } catch {
    // Drive folder creation is best-effort; don't fail the asset save
  }

  revalidatePath(`/pro/contacts/${contact_id}`);
  return { success: true };
}

export async function updateAssetNotes(
  _prev: AssetState,
  formData: FormData
): Promise<AssetState> {
  const asset_id          = formData.get("asset_id")             as string;
  const contact_id        = formData.get("contact_id")           as string;
  const notes             = (formData.get("notes") as string)?.trim() || null;
  const last_service_date = (formData.get("last_service_date") as string)?.trim() || null;
  const intervalRaw       = formData.get("service_interval_days") as string;
  const service_interval_days = intervalRaw ? parseInt(intervalRaw, 10) : null;

  if (!asset_id) return { error: "Missing asset ID." };

  const supabase = await svc();
  const { error } = await supabase.from("vessels").update({
    notes,
    ...(last_service_date !== null ? { last_service_date } : {}),
    ...(service_interval_days && !isNaN(service_interval_days) ? { service_interval_days } : {}),
  }).eq("id", asset_id);
  if (error) return { error: error.message };

  if (contact_id) revalidatePath(`/pro/contacts/${contact_id}`);
  return { success: true };
}

export async function updateAsset(
  _prev: AssetState,
  formData: FormData
): Promise<AssetState> {
  const asset_id   = formData.get("asset_id")   as string;
  const contact_id = formData.get("contact_id") as string;
  if (!asset_id) return { error: "Missing asset ID." };

  const supabase = await svc();
  const { error } = await supabase.from("vessels").update({
    name:       (formData.get("name")       as string)?.trim() || null,
    make_model: (formData.get("make_model") as string)?.trim() || null,
    year:       parseInt(formData.get("year") as string, 10) || null,
    color:      (formData.get("color")      as string)?.trim() || null,
    length_ft:  (formData.get("length_ft")  as string)?.trim().replace(/\s*ft\s*$/i, "") || null,
    registration: (formData.get("registration") as string)?.trim() || null,
    location:   (formData.get("location")   as string)?.trim() || null,
  }).eq("id", asset_id);
  if (error) return { error: error.message };
  if (contact_id) revalidatePath(`/pro/contacts/${contact_id}`);
  return { success: true };
}

export async function deleteAsset(assetId: string, contactId: string): Promise<{ error?: string }> {
  const supabase = await svc();
  await supabase.from("vessel_services").delete().eq("vessel_id", assetId);
  const { error } = await supabase.from("vessels").delete().eq("id", assetId);
  if (error) return { error: error.message };
  revalidatePath(`/pro/contacts/${contactId}`);
  return {};
}

// ─── Update Lead Field ────────────────────────────────────────────────────────

export type LeadFieldState = { error?: string; success?: boolean };

export async function updateLeadField(
  _prev: LeadFieldState,
  formData: FormData
): Promise<LeadFieldState> {
  const lead_id = formData.get("lead_id") as string;
  const field   = formData.get("field")   as string;
  const value   = (formData.get("value")  as string)?.trim() || null;

  const ALLOWED = ["name", "email", "phone", "vessel_type", "vessel_length", "service"];
  if (!lead_id || !field || !ALLOWED.includes(field)) return { error: "Invalid request." };

  const supabase = await svc();
  const { error } = await supabase.from("leads").update({ [field]: value }).eq("id", lead_id);
  if (error) return { error: error.message };
  revalidatePath(`/pro/leads/${lead_id}`);
  revalidatePath("/pro/leads");
  return { success: true };
}

// ─── Update Contact Field ─────────────────────────────────────────────────────

export type ContactFieldState = { error?: string; success?: boolean };

export async function updateContactField(
  _prev: ContactFieldState,
  formData: FormData
): Promise<ContactFieldState> {
  const contact_id = formData.get("contact_id") as string;
  const field      = formData.get("field")      as string;
  const value      = (formData.get("value")     as string)?.trim() || null;

  const ALLOWED = ["address", "name", "email", "phone"];
  if (!contact_id || !field || !ALLOWED.includes(field)) return { error: "Invalid request." };

  const supabase = await svc();
  const { error } = await supabase.from("contacts").update({ [field]: value }).eq("id", contact_id);
  if (error) return { error: error.message };
  revalidatePath(`/pro/contacts/${contact_id}`);
  return { success: true };
}

export async function createContact(fields: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  company_name?: string;
  contact_type?: string;
  waiver_signed?: boolean;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = await svc();
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      name:          fields.name?.trim()         || null,
      company_name:  fields.company_name?.trim() || null,
      email:         fields.email?.trim()        || null,
      phone:         normalizePhone(fields.phone) || null,
      address:       fields.address?.trim()      || null,
      contact_type:  fields.contact_type         || "customer",
      waiver_signed: fields.waiver_signed        ?? false,
      source:        "manual",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pro/contacts");

  // Push to QB in the background
  const contactId = data.id;
  (async () => {
    try {
      const { findOrCreateQbCustomer, getQbTokens } = await import("@/lib/quickbooks");
      const tokens = await getQbTokens();
      if (!tokens) return;
      await findOrCreateQbCustomer({ id: contactId, name: fields.name?.trim() ?? null, company_name: fields.company_name?.trim() ?? null, email: fields.email?.trim() ?? null, phone: fields.phone?.trim() ?? null });
    } catch { /* non-fatal */ }
  })();

  // Push to Quo in the background — don't block the response
  (async () => {
    try {
      const { createOpenPhoneContact, splitName } = await import("@/lib/openphone");
      const { firstName, lastName } = splitName(fields.name?.trim() ?? "");
      const payload = {
        firstName,
        lastName: lastName || undefined,
        company: fields.company_name?.trim() || undefined,
        phoneNumbers: fields.phone?.trim() ? [{ name: "main", value: fields.phone.trim() }] : [],
        emails: fields.email?.trim() ? [{ name: "main", value: fields.email.trim() }] : [],
      };
      const newId = await createOpenPhoneContact(payload);
      if (newId) {
        const { createClient: cc } = await import("@supabase/supabase-js");
        const sb = cc(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
        await sb.from("contacts").update({ openphone_contact_id: newId }).eq("id", contactId);
      }
    } catch { /* non-fatal */ }
  })();

  return { ok: true, id: data.id };
}

export async function updateContactFields(
  contactId: string,
  fields: { name?: string | null; email?: string | null; phone?: string | null; address?: string | null; waiver_signed?: boolean; contact_type?: string | null; company_name?: string | null; notes?: string | null }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await svc();
  const patch: Record<string, string | boolean | null> = {};
  if ("name"          in fields) patch.name          = fields.name?.trim()         || null;
  if ("company_name"  in fields) patch.company_name  = fields.company_name?.trim() || null;
  if ("email"         in fields) patch.email         = fields.email?.trim()        || null;
  if ("phone"         in fields) patch.phone         = normalizePhone(fields.phone) || null;
  if ("address"       in fields) patch.address       = fields.address?.trim()      || null;
  if ("notes"         in fields) patch.notes         = fields.notes?.trim()        || null;
  if ("waiver_signed" in fields) patch.waiver_signed = fields.waiver_signed ?? false;
  if ("contact_type"  in fields) patch.contact_type  = fields.contact_type        || null;
  const { error } = await supabase.from("contacts").update(patch).eq("id", contactId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/pro/contacts/${contactId}`);

  // Push name/email/phone changes to Quo in the background
  const quoFields = ["name", "email", "phone", "company_name"] as const;
  const hasQuoField = quoFields.some((f) => f in fields);
  if (hasQuoField) {
    (async () => {
      try {
        const { data: contact } = await supabase.from("contacts").select("openphone_contact_id, name, email, phone, company_name").eq("id", contactId).single();
        if (!contact?.openphone_contact_id) return;
        const { updateOpenPhoneContact, splitName } = await import("@/lib/openphone");
        const { firstName, lastName } = splitName(contact.name?.trim() ?? "");
        await updateOpenPhoneContact(contact.openphone_contact_id, {
          firstName,
          lastName: lastName || undefined,
          company: contact.company_name?.trim() || undefined,
          phoneNumbers: contact.phone ? [{ name: "main", value: contact.phone }] : [],
          emails: contact.email ? [{ name: "main", value: contact.email }] : [],
        });
      } catch { /* non-fatal */ }
    })();
  }

  return { ok: true };
}

export async function pushCrmFieldToQb(
  contactId: string,
  field: "name" | "email" | "phone"
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await svc();
  try {
    const { data: contact } = await supabase
      .from("contacts")
      .select("id, name, company_name, email, phone, qb_customer_id")
      .eq("id", contactId)
      .single();
    if (!contact?.qb_customer_id) return { ok: false, error: "Contact not linked to QB." };

    const { getQbCustomer, getValidTokens } = await import("@/lib/quickbooks");

    // Fetch current QB customer to get SyncToken (required for updates)
    const qbCustomer = await getQbCustomer(contact.qb_customer_id);
    const syncToken = qbCustomer.SyncToken ?? "0";

    const tokens = await getValidTokens();

    // Build sparse update payload for just the changed field
    const patch: Record<string, unknown> = {
      Id: contact.qb_customer_id,
      SyncToken: syncToken,
      sparse: true,
    };
    if (field === "email") {
      patch.PrimaryEmailAddr = contact.email ? { Address: contact.email } : null;
    } else if (field === "phone") {
      patch.PrimaryPhone = contact.phone ? { FreeFormNumber: contact.phone } : null;
    } else if (field === "name") {
      const displayName = contact.name?.trim() || contact.company_name?.trim() || contact.email || "Unknown";
      patch.DisplayName = displayName;
      if (contact.company_name?.trim()) patch.CompanyName = contact.company_name.trim();
    }

    const url = `https://quickbooks.api.intuit.com/v3/company/${tokens.realm_id}/customer?minorversion=70`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `QB update failed: ${body}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to push to QB." };
  }
}

// ─── Vessel Service Schedules ─────────────────────────────────────────────────

export type VesselServiceState = { error?: string; success?: boolean };

export async function addVesselService(
  _prev: VesselServiceState,
  formData: FormData
): Promise<VesselServiceState> {
  const vessel_id       = formData.get("vessel_id")        as string;
  const contact_id      = formData.get("contact_id")       as string;
  const service_name    = (formData.get("service_name") as string)?.trim();
  const intervalRaw     = formData.get("interval_days")    as string;
  const interval_days   = intervalRaw ? parseInt(intervalRaw, 10) : 90;
  const last_service_date = (formData.get("last_service_date") as string)?.trim() || null;

  if (!vessel_id || !service_name) return { error: "Vessel and service name are required." };

  const priceRaw    = (formData.get("typical_price") as string)?.trim();
  const typical_price = priceRaw ? parseFloat(priceRaw) : null;

  const supabase = await svc();
  const { error } = await supabase.from("vessel_services").insert({
    vessel_id,
    service_name,
    interval_days: isNaN(interval_days) ? 90 : interval_days,
    last_service_date: last_service_date || null,
    typical_price: typical_price !== null && !isNaN(typical_price) ? typical_price : null,
  });
  if (error) return { error: error.message };
  if (contact_id) revalidatePath(`/pro/contacts/${contact_id}`);
  return { success: true };
}

export async function markServiced(
  _prev: VesselServiceState,
  formData: FormData
): Promise<VesselServiceState> {
  const service_id  = formData.get("service_id")  as string;
  const contact_id  = formData.get("contact_id")  as string;
  const date        = (formData.get("date") as string)?.trim() ||
    new Date().toISOString().split("T")[0];

  if (!service_id) return { error: "Missing service ID." };

  const supabase = await svc();
  const { error } = await supabase
    .from("vessel_services")
    .update({ last_service_date: date })
    .eq("id", service_id);
  if (error) return { error: error.message };
  if (contact_id) revalidatePath(`/pro/contacts/${contact_id}`);
  return { success: true };
}

export async function updateVesselService(
  _prev: VesselServiceState,
  formData: FormData
): Promise<VesselServiceState> {
  const service_id           = formData.get("service_id")           as string;
  const contact_id           = formData.get("contact_id")           as string;
  const service_name         = (formData.get("service_name") as string)?.trim();
  const interval_days        = parseInt(formData.get("interval_days") as string, 10);
  const notifications_enabled = formData.get("notifications_enabled") === "true";
  const priceRaw             = (formData.get("typical_price") as string)?.trim();
  const typical_price        = priceRaw ? parseFloat(priceRaw) : null;

  if (!service_id || !service_name) return { error: "Service name required." };
  if (isNaN(interval_days))         return { error: "Valid interval required." };

  const supabase = await svc();
  const { error } = await supabase
    .from("vessel_services")
    .update({
      service_name,
      interval_days,
      notifications_enabled,
      typical_price: typical_price !== null && !isNaN(typical_price) ? typical_price : null,
    })
    .eq("id", service_id);
  if (error) return { error: error.message };
  if (contact_id) revalidatePath(`/pro/contacts/${contact_id}`);
  return { success: true };
}

export async function deleteVesselService(
  _prev: VesselServiceState,
  formData: FormData
): Promise<VesselServiceState> {
  const service_id = formData.get("service_id") as string;
  const contact_id = formData.get("contact_id") as string;

  if (!service_id) return { error: "Missing service ID." };

  const supabase = await svc();
  const { error } = await supabase.from("vessel_services").delete().eq("id", service_id);
  if (error) return { error: error.message };
  if (contact_id) revalidatePath(`/pro/contacts/${contact_id}`);
  return { success: true };
}

// ─── Create Maintenance Invoice from Vessel Service ───────────────────────────

export type MaintenanceInvoiceState = { error?: string; success?: boolean; invoiceUrl?: string; docNumber?: string };

export async function createMaintenanceInvoice(
  _prev: MaintenanceInvoiceState,
  formData: FormData
): Promise<MaintenanceInvoiceState> {
  const service_id = formData.get("service_id") as string;
  const contact_id = formData.get("contact_id") as string;

  if (!service_id || !contact_id) return { error: "Missing required fields." };

  const supabase = await svc();

  const { data: service } = await supabase
    .from("vessel_services")
    .select("service_name, typical_price, vessel_id")
    .eq("id", service_id)
    .single();
  if (!service) return { error: "Service record not found." };

  const { data: contact } = await supabase
    .from("contacts")
    .select("qb_customer_id, name")
    .eq("id", contact_id)
    .single();
  if (!contact?.qb_customer_id) return { error: "Contact has no linked QuickBooks customer. Link the contact to QuickBooks first." };

  try {
    const { createQbInvoiceDraft, getQbInvoiceUrl, getValidTokens } = await import("@/lib/quickbooks");
    const tokens = await getValidTokens();
    const { invoiceId, docNumber } = await createQbInvoiceDraft({
      qbCustomerId:    contact.qb_customer_id,
      lineDescription: service.service_name,
      amount:          service.typical_price ?? 0,
    });

    const invoiceUrl = getQbInvoiceUrl(tokens.realm_id, invoiceId);

    const today = new Date().toISOString().split("T")[0];
    await supabase.from("vessel_services").update({ last_service_date: today }).eq("id", service_id);

    await supabase.from("timeline_events").insert({
      contact_id,
      event_type: "invoice",
      title:      docNumber ? `Invoice #${docNumber}` : "Invoice (Draft)",
      body:       `${service.service_name}${service.typical_price ? ` — $${service.typical_price.toFixed(2)}` : ""}`,
      metadata:   { qb_invoice_id: `Invoice:${invoiceId}`, doc_number: docNumber || null, invoice_url: invoiceUrl, total: service.typical_price ?? 0, status: "Unpaid" },
      created_by: "pro",
    });

    revalidatePath(`/pro/contacts/${contact_id}`);
    return { success: true, invoiceUrl, docNumber };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create invoice." };
  }
}

// ─── Calendar Event → Contact Linking ────────────────────────────────────────

export type CalendarLinkState = { error?: string; success?: boolean };

export async function linkCalendarEvent(
  _prev: CalendarLinkState,
  formData: FormData
): Promise<CalendarLinkState> {
  const gcal_event_id        = formData.get("gcal_event_id")        as string;
  const contact_id           = formData.get("contact_id")           as string;
  const vessel_id            = (formData.get("vessel_id") as string)?.trim() || null;
  const service_template_id  = (formData.get("service_template_id") as string)?.trim() || null;
  const service_label        = (formData.get("service_label") as string)?.trim() || null;
  const invoice_amount_raw   = (formData.get("invoice_amount") as string)?.trim();
  const invoice_amount       = invoice_amount_raw ? parseFloat(invoice_amount_raw) : null;
  const invoice_discount_raw = (formData.get("invoice_discount") as string)?.trim();
  const invoice_discount     = invoice_discount_raw ? parseFloat(invoice_discount_raw) : null;
  const invoice_qty_raw      = (formData.get("invoice_qty") as string)?.trim();
  const invoice_qty          = invoice_qty_raw ? parseFloat(invoice_qty_raw) : 1;
  const invoice_rate_raw     = (formData.get("invoice_rate") as string)?.trim();
  const invoice_rate         = invoice_rate_raw ? parseFloat(invoice_rate_raw) : null;
  const auto_invoice         = formData.get("auto_invoice") === "true";

  if (!gcal_event_id || !contact_id) return { error: "Missing required fields." };

  const supabase = await svc();
  const { error } = await supabase
    .from("calendar_contact_links")
    .upsert(
      {
        gcal_event_id, contact_id, vessel_id, service_template_id, service_label,
        invoice_amount, invoice_discount, invoice_qty, invoice_rate, auto_invoice,
      },
      { onConflict: "gcal_event_id" }
    );
  if (error) return { error: error.message };

  revalidatePath("/pro/calendar");
  return { success: true };
}

export async function unlinkCalendarEvent(gcalEventId: string): Promise<{ error?: string }> {
  const supabase = await svc();
  const { error } = await supabase
    .from("calendar_contact_links")
    .delete()
    .eq("gcal_event_id", gcalEventId);
  if (error) return { error: error.message };
  revalidatePath("/pro/calendar");
  return {};
}

export type CalendarInvoiceState = { error?: string; success?: boolean; invoiceUrl?: string; docNumber?: string };

export async function createInvoiceFromCalendarEvent(
  _prev: CalendarInvoiceState,
  formData: FormData
): Promise<CalendarInvoiceState> {
  const contact_id    = formData.get("contact_id")    as string;
  const gcal_event_id = formData.get("gcal_event_id") as string;
  const service_label = (formData.get("service_label") as string)?.trim() || "Maintenance Wash";
  const amountRaw     = (formData.get("amount") as string)?.trim();
  const amount        = amountRaw ? parseFloat(amountRaw) : 0;
  const event_date    = (formData.get("event_date") as string)?.trim() || undefined;

  if (!contact_id || !gcal_event_id) return { error: "Missing required fields." };

  const supabase = await svc();

  const [{ data: contact }, { data: calLink }] = await Promise.all([
    supabase.from("contacts").select("qb_customer_id").eq("id", contact_id).single(),
    supabase
      .from("calendar_contact_links")
      .select("service_template_id, service_templates(description)")
      .eq("gcal_event_id", gcal_event_id)
      .maybeSingle(),
  ]);

  if (!contact?.qb_customer_id) return { error: "Contact has no linked QuickBooks customer." };

  const tpl = calLink?.service_templates as unknown as { description: string | null } | null;
  const lineBody = tpl?.description ?? null;

  try {
    const { createQbInvoiceDraft, getQbInvoiceUrl, getValidTokens } = await import("@/lib/quickbooks");
    const tokens = await getValidTokens();
    const { invoiceId, docNumber } = await createQbInvoiceDraft({
      qbCustomerId:    contact.qb_customer_id,
      lineDescription: service_label,
      lineBody,
      amount:          isNaN(amount) ? 0 : amount,
      txnDate:         event_date,
    });
    const invoiceUrl = getQbInvoiceUrl(tokens.realm_id, invoiceId);

    await supabase.from("timeline_events").insert({
      contact_id,
      event_type: "invoice",
      title:      docNumber ? `Invoice #${docNumber}` : "Invoice (Draft)",
      body:       `${service_label}${amount ? ` — $${amount.toFixed(2)}` : ""}`,
      metadata:   {
        qb_invoice_id:   `Invoice:${invoiceId}`,
        doc_number:      docNumber || null,
        invoice_url:     invoiceUrl,
        total:           isNaN(amount) ? 0 : amount,
        status:          "Unpaid",
        gcal_event_id,
        linked_from:     "calendar_event",
      },
      created_by: "pro",
    });

    revalidatePath(`/pro/contacts/${contact_id}`);
    revalidatePath("/pro/calendar");
    return { success: true, invoiceUrl, docNumber };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create invoice." };
  }
}

// ─── Claim Calendar Event to Existing Invoice ────────────────────────────────

export async function getContactInvoices(
  contactId: string
): Promise<{ id: string; title: string | null; body: string | null; metadata: Record<string, unknown> | null }[]> {
  const supabase = await svc();
  const { data } = await supabase
    .from("timeline_events")
    .select("id, title, body, metadata")
    .eq("contact_id", contactId)
    .eq("event_type", "invoice")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as { id: string; title: string | null; body: string | null; metadata: Record<string, unknown> | null }[];

  // Deduplicate by doc_number: keep the entry with invoice_url (cron-created) over one without.
  // Drop entries that have neither a doc_number nor an invoice_url (stale import artifacts).
  const seen = new Map<string, typeof rows[0]>();
  const out: typeof rows = [];
  for (const row of rows) {
    const meta = row.metadata ?? {};
    const docNum = meta.doc_number as string | null | undefined;
    const hasUrl = Boolean(meta.invoice_url);

    if (!docNum && !hasUrl) continue; // stale artifact with no useful data

    if (docNum) {
      const existing = seen.get(docNum);
      if (!existing) {
        seen.set(docNum, row);
        out.push(row);
      } else if (hasUrl && !existing.metadata?.invoice_url) {
        // Replace with the richer entry (has URL)
        const idx = out.indexOf(existing);
        out[idx] = row;
        seen.set(docNum, row);
      }
      // else: duplicate with same or less data — skip
    } else {
      // No doc_number but has invoice_url: keep (manually linked invoice)
      out.push(row);
    }
  }
  return out;
}

export async function claimGcalEventToInvoice(
  timelineEventId: string,
  gcalEventId: string
): Promise<{ error?: string }> {
  const supabase = await svc();
  const { data: ev } = await supabase
    .from("timeline_events")
    .select("metadata, contact_id")
    .eq("id", timelineEventId)
    .single();
  if (!ev) return { error: "Invoice not found." };

  const { error } = await supabase
    .from("timeline_events")
    .update({ metadata: { ...(ev.metadata ?? {}), gcal_event_id: gcalEventId } })
    .eq("id", timelineEventId);
  if (error) return { error: error.message };

  revalidatePath(`/pro/contacts/${ev.contact_id}`);
  return {};
}

export async function getLinkedInvoiceForEvent(
  gcalEventId: string,
  contactId: string
): Promise<{ title: string; url: string | null } | null> {
  const supabase = await svc();
  const { data: events } = await supabase
    .from("timeline_events")
    .select("id, title, metadata")
    .eq("contact_id", contactId)
    .eq("event_type", "invoice");

  const match = (events ?? []).find(
    e => (e.metadata as { gcal_event_id?: string } | null)?.gcal_event_id === gcalEventId
  );
  if (!match) return null;

  const meta = match.metadata as { invoice_url?: string; qb_invoice_id?: string } | null;
  const invoiceUrl = meta?.invoice_url ?? null;

  // Verify the QB invoice still exists; auto-clear if deleted
  const qbInvoiceId = meta?.qb_invoice_id?.replace("Invoice:", "");
  if (qbInvoiceId) {
    try {
      const { getValidTokens } = await import("@/lib/quickbooks");
      const tokens = await getValidTokens();
      const res = await fetch(
        `https://quickbooks.api.intuit.com/v3/company/${tokens.realm_id}/invoice/${qbInvoiceId}?minorversion=70`,
        { headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" } }
      );
      if (res.status === 400 || res.status === 404) {
        // Invoice deleted in QB — clear the link automatically
        const newMeta = { ...(match.metadata as Record<string, unknown>), gcal_event_id: null };
        await supabase.from("timeline_events").update({ metadata: newMeta }).eq("id", match.id);
        return null;
      }
    } catch {
      // QB check failed (network, token, etc.) — show the invoice anyway
    }
  }

  return { title: match.title ?? "Invoice", url: invoiceUrl };
}

export async function removeGcalFromInvoice(
  gcalEventId: string,
  contactId: string
): Promise<{ error?: string }> {
  const supabase = await svc();
  const { data: events } = await supabase
    .from("timeline_events")
    .select("id, metadata")
    .eq("contact_id", contactId)
    .eq("event_type", "invoice");

  const match = (events ?? []).find(
    e => (e.metadata as { gcal_event_id?: string } | null)?.gcal_event_id === gcalEventId
  );
  if (!match) return {};

  const newMeta = { ...(match.metadata as Record<string, unknown>), gcal_event_id: null };
  const { error } = await supabase
    .from("timeline_events")
    .update({ metadata: newMeta })
    .eq("id", match.id);
  if (error) return { error: error.message };
  return {};
}

// ─── Calendar Contact Search Helpers ─────────────────────────────────────────

export async function searchContactsByName(
  query: string
): Promise<{ id: string; name: string; email: string | null; address: string | null }[]> {
  if (!query || query.trim().length < 2) return [];
  const supabase = await svc();
  const { data } = await supabase
    .from("contacts")
    .select("id, name, email, address")
    .ilike("name", `%${query.trim()}%`)
    .limit(6)
    .order("name");
  return (data ?? []) as { id: string; name: string; email: string | null; address: string | null }[];
}

export async function getVesselsByContactId(
  contactId: string
): Promise<{ id: string; name: string | null; make_model: string | null; length_ft: string | null }[]> {
  if (!contactId) return [];
  const supabase = await svc();
  const { data } = await supabase
    .from("vessels")
    .select("id, name, make_model, length_ft")
    .eq("owner_id", contactId)
    .order("created_at");
  return (data ?? []) as { id: string; name: string | null; make_model: string | null; length_ft: string | null }[];
}

export type ContactCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  vesselId: string | null;
};

export async function getContactCalendarEvents(contactId: string): Promise<ContactCalendarEvent[]> {
  const supabase = await svc();
  const { data: links } = await supabase
    .from("calendar_contact_links")
    .select("gcal_event_id, vessel_id")
    .eq("contact_id", contactId);

  if (!links?.length) return [];

  const { getEventById } = await import("@/lib/google-calendar");
  const settled = await Promise.allSettled(
    links.map(async (link) => {
      const ev = await getEventById(link.gcal_event_id);
      if (!ev) return null;
      return { id: ev.id, title: ev.title, start: ev.start, end: ev.end, location: ev.location, vesselId: link.vessel_id ?? null } as ContactCalendarEvent;
    })
  );

  return settled
    .filter((r): r is PromiseFulfilledResult<ContactCalendarEvent | null> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value!)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export type VesselRecurringLink = {
  gcal_event_id: string;
  service_label: string | null;
  invoice_amount: number | null;
  invoice_discount: number | null;
  auto_invoice: boolean;
};

export async function getVesselRecurringLinks(vesselId: string): Promise<VesselRecurringLink[]> {
  if (!vesselId) return [];
  const supabase = await svc();
  const { data } = await supabase
    .from("calendar_contact_links")
    .select("gcal_event_id, service_label, invoice_amount, invoice_discount, auto_invoice")
    .eq("vessel_id", vesselId)
    .order("service_label");
  return (data ?? []).map(r => ({
    gcal_event_id:    r.gcal_event_id,
    service_label:    r.service_label ?? null,
    invoice_amount:   r.invoice_amount != null ? Number(r.invoice_amount) : null,
    invoice_discount: r.invoice_discount != null ? Number(r.invoice_discount) : null,
    auto_invoice:     r.auto_invoice ?? false,
  }));
}

// ─── Linked Contacts ──────────────────────────────────────────────────────────

export type LinkedContactState = { error?: string; success?: boolean };

export async function addLinkedContact(
  _prev: LinkedContactState,
  formData: FormData
): Promise<LinkedContactState> {
  const primary_contact_id = formData.get("primary_contact_id") as string;
  const name               = (formData.get("name")         as string)?.trim();
  const phone              = normalizePhone((formData.get("phone") as string)?.trim());
  const email              = (formData.get("email")        as string)?.trim() || null;
  const relationship       = (formData.get("relationship") as string)?.trim() || "associate";

  if (!primary_contact_id || !name) return { error: "Name is required." };

  const supabase = await svc();
  const { error } = await supabase.from("linked_contacts").insert({
    primary_contact_id,
    name,
    phone,
    email,
    relationship,
    authorized_to_approve: false,
  });

  if (error) return { error: error.message };
  revalidatePath(`/pro/contacts/${primary_contact_id}`);
  return { success: true };
}

export async function toggleLinkedContactAuth(
  _prev: LinkedContactState,
  formData: FormData
): Promise<LinkedContactState> {
  const id         = formData.get("id")         as string;
  const contact_id = formData.get("contact_id") as string;
  const authorized = formData.get("authorized") === "true";

  if (!id) return { error: "Missing ID." };

  const supabase = await svc();
  const { error } = await supabase
    .from("linked_contacts")
    .update({ authorized_to_approve: authorized })
    .eq("id", id);

  if (error) return { error: error.message };
  if (contact_id) revalidatePath(`/pro/contacts/${contact_id}`);
  return { success: true };
}

export async function removeLinkedContact(
  _prev: LinkedContactState,
  formData: FormData
): Promise<LinkedContactState> {
  const id         = formData.get("id")         as string;
  const contact_id = formData.get("contact_id") as string;

  if (!id) return { error: "Missing ID." };

  const supabase = await svc();
  const { error } = await supabase.from("linked_contacts").delete().eq("id", id);
  if (error) return { error: error.message };

  if (contact_id) revalidatePath(`/pro/contacts/${contact_id}`);
  return { success: true };
}

// ─── Google Calendar Sync ─────────────────────────────────────────────────────

export type CalendarSyncState = { error?: string; success?: boolean; eventId?: string };

export async function syncAppointmentToGoogle(
  _prev: CalendarSyncState,
  formData: FormData
): Promise<CalendarSyncState> {
  const contact_id    = formData.get("contact_id")    as string;
  const contact_name  = formData.get("contact_name")  as string;
  const vessel_name   = formData.get("vessel_name")   as string | null;
  const service       = formData.get("service")       as string;
  const start_time    = formData.get("start_time")    as string;
  const end_time      = formData.get("end_time")      as string;
  const location      = formData.get("location")      as string | null;
  const access_info   = formData.get("access_info")   as string | null;
  const service_notes = formData.get("service_notes") as string | null;

  if (!contact_id || !service || !start_time || !end_time) {
    return { error: "Missing required fields." };
  }

  try {
    const { createCalendarEvent } = await import("@/lib/google-calendar");
    const title = vessel_name
      ? `${service} — ${vessel_name} (${contact_name})`
      : `${service} — ${contact_name}`;

    const descParts: string[] = [];
    if (access_info)   descParts.push(`Access Info: ${access_info}`);
    if (service_notes) descParts.push(`Service Notes: ${service_notes}`);
    descParts.push(`Contact Dossier: ${process.env.NEXT_PUBLIC_SITE_URL}/pro/contacts/${contact_id}`);

    const eventId = await createCalendarEvent({
      title,
      description: descParts.join("\n\n"),
      location: location ?? undefined,
      startTime: start_time,
      endTime:   end_time,
    });

    const supabase = await svc();
    await supabase.from("timeline_events").insert({
      contact_id,
      event_type: "appointment_scheduled",
      title: `Appointment synced to Google Calendar`,
      body: `${service} on ${new Date(start_time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`,
      metadata: { google_event_id: eventId, service, start_time, end_time, location, access_info },
      created_by: "pro",
    });

    revalidatePath(`/pro/contacts/${contact_id}`);
    revalidatePath("/pro/pipeline");
    return { success: true, eventId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Calendar sync failed.";
    return { error: message };
  }
}

// ─── Calendar Webhook Registration ───────────────────────────────────────────

export async function registerCalendarWebhook(): Promise<{ ok?: boolean; expires?: string; error?: string }> {
  const { google } = await import("googleapis");

  const subject     = process.env.GOOGLE_CALENDAR_SUBJECT;
  const CAL_SCOPE   = "https://www.googleapis.com/auth/calendar";
  const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "primary";
  const webhookUrl  = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/google-calendar`;

  let auth;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    auth = new google.auth.GoogleAuth({
      credentials:   JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes:        [CAL_SCOPE],
      clientOptions: subject ? { subject } : undefined,
    });
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    auth = new google.auth.JWT({
      email:   process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key:     process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes:  [CAL_SCOPE],
      subject: subject,
    });
  } else {
    return { error: "Google service account credentials are not configured." };
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });
    const res = await calendar.events.watch({
      calendarId: CALENDAR_ID,
      requestBody: {
        id:      `${clientConfig.companyShortName.toLowerCase().replace(/\s+/g, "")}-crm-${Date.now()}`,
        type:    "web_hook",
        address: webhookUrl,
        token:   process.env.GOOGLE_WEBHOOK_TOKEN ?? "",
      },
    });

    const expires = res.data.expiration
      ? new Date(parseInt(res.data.expiration)).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const supabase = await createServerSupabase();
    const { data: existing } = await supabase
      .from("system_flags")
      .select("id")
      .eq("flag_type", "calendar_webhook_channel")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase.from("system_flags").update({ message: expires, resolved: false }).eq("id", existing.id);
    } else {
      await supabase.from("system_flags").insert({
        flag_type:      "calendar_webhook_channel",
        reference_type: "system",
        reference_id:   "calendar_webhook",
        message:        expires,
        resolved:       false,
      });
    }

    revalidatePath("/pro/integrations");
    return { ok: true, expires };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to register webhook." };
  }
}

// ─── Standalone Calendar Event CRUD ──────────────────────────────────────────

export type CalendarEventState = { error?: string; success?: boolean; eventId?: string };

export async function createStandaloneEvent(
  _prev: CalendarEventState,
  formData: FormData
): Promise<CalendarEventState> {
  const title       = formData.get("title")       as string;
  const start_time  = formData.get("start_time")  as string;
  const end_time    = formData.get("end_time")     as string;
  const description = formData.get("description") as string | null;
  const location    = formData.get("location")    as string | null;
  const is_all_day  = formData.get("is_all_day")  === "true";
  const color_id    = formData.get("color_id")    as string | null;

  if (!title || !start_time || !end_time) return { error: "Title, start, and end time are required." };

  // All-day end dates from the form are inclusive; Google needs exclusive (next day)
  function nextDay(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${next.getFullYear()}-${p(next.getMonth() + 1)}-${p(next.getDate())}`;
  }

  try {
    const { createCalendarEvent } = await import("@/lib/google-calendar");
    const eventId = await createCalendarEvent({
      title,
      description: description ?? undefined,
      location:    location    ?? undefined,
      startTime:   start_time,
      endTime:     is_all_day ? nextDay(end_time) : end_time,
      isAllDay:    is_all_day,
      colorId:     color_id ?? undefined,
    });
    revalidatePath("/pro/calendar");
    revalidatePath("/pro/pipeline");
    return { success: true, eventId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create event." };
  }
}

export async function updateStandaloneEvent(
  _prev: CalendarEventState,
  formData: FormData
): Promise<CalendarEventState> {
  const event_id    = formData.get("event_id")    as string;
  const title       = formData.get("title")       as string;
  const start_time  = formData.get("start_time")  as string;
  const end_time    = formData.get("end_time")     as string;
  const description = formData.get("description") as string | null;
  const location    = formData.get("location")    as string | null;
  const is_all_day  = formData.get("is_all_day")  === "true";
  const color_id    = formData.get("color_id")    as string | null;

  if (!event_id || !title || !start_time || !end_time) return { error: "Missing required fields." };

  function nextDay(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${next.getFullYear()}-${p(next.getMonth() + 1)}-${p(next.getDate())}`;
  }

  try {
    const { updateCalendarEvent } = await import("@/lib/google-calendar");
    await updateCalendarEvent(event_id, {
      title,
      description: description ?? undefined,
      location:    location    ?? undefined,
      startTime:   start_time,
      endTime:     is_all_day ? nextDay(end_time) : end_time,
      isAllDay:    is_all_day,
      colorId:     color_id ?? undefined,
    });
    revalidatePath("/pro/calendar");
    revalidatePath("/pro/pipeline");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update event." };
  }
}

export async function deleteStandaloneEvent(eventId: string): Promise<{ error?: string }> {
  try {
    const { deleteCalendarEvent } = await import("@/lib/google-calendar");
    await deleteCalendarEvent(eventId);
    revalidatePath("/pro/calendar");
    revalidatePath("/pro/pipeline");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete event." };
  }
}

// ─── New+ Service Event Actions ───────────────────────────────────────────────

export type NewEventState = { error?: string; success?: boolean; eventId?: string };

// Frequency label → RRULE mapping
export async function createServiceEvent(
  _prev: NewEventState,
  formData: FormData
): Promise<NewEventState> {
  const contact_id      = formData.get("contact_id")       as string;
  const contact_name    = formData.get("contact_name")     as string;
  const contact_address = formData.get("contact_address")  as string | null;
  const vessel_id       = formData.get("vessel_id")        as string | null;
  const vessel_name     = formData.get("vessel_name")      as string | null;
  const template_id     = formData.get("template_id")      as string | null;
  const service_label   = formData.get("service_label")    as string;
  const qty_raw         = formData.get("qty")              as string;
  const rate_raw        = formData.get("rate")             as string;
  const discount_raw    = formData.get("discount")         as string;
  const start_time      = formData.get("start_time")       as string;
  const end_time        = formData.get("end_time")         as string;
  const frequency       = formData.get("frequency")        as string | null;
  const freq_unit       = (formData.get("freq_unit") as string | null) || "weeks";
  const description     = formData.get("description")      as string | null;

  if (!contact_id || !service_label || !start_time) {
    return { error: "Contact, service, and date are required." };
  }

  const qty      = Math.max(0.01, parseFloat(qty_raw  || "1"));
  const rate     = Math.max(0,    parseFloat(rate_raw  || "0"));
  const discount = Math.max(0,    parseFloat(discount_raw || "0"));
  const amount   = Math.max(0, qty * rate - discount);

  const nameParts = [contact_name.trim(), vessel_name?.trim(), service_label.trim()].filter(Boolean);
  const title = nameParts.join(" - ");

  const freqN    = frequency ? Math.max(1, parseInt(frequency, 10)) : null;

  // All-day: end date must be the next calendar day for GCal
  const dateOnly = start_time.split("T")[0];
  const nextDate = new Date(dateOnly + "T12:00:00");
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateStr = nextDate.toISOString().split("T")[0];

  // Build RRULE — for weekly and monthly, pin to the same weekday as the start date
  // so events always land on the same day of week regardless of interval.
  const RRULE_DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const startDateObj = new Date(dateOnly + "T12:00:00");
  const dayCode      = RRULE_DAYS[startDateObj.getDay()];
  const dayOfMonth   = startDateObj.getDate();
  const ordinal      = Math.ceil(dayOfMonth / 7);
  const daysInMonth  = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + 1, 0).getDate();
  const byDay        = dayOfMonth + 7 > daysInMonth ? `-1${dayCode}` : `${ordinal}${dayCode}`;

  let recurrenceRule: string | undefined;
  if (freqN) {
    if (freq_unit === "days") {
      recurrenceRule = `RRULE:FREQ=DAILY;INTERVAL=${freqN}`;
    } else if (freq_unit === "months") {
      recurrenceRule = `RRULE:FREQ=MONTHLY;INTERVAL=${freqN};BYDAY=${byDay}`;
    } else {
      recurrenceRule = `RRULE:FREQ=WEEKLY;INTERVAL=${freqN};BYDAY=${dayCode}`;
    }
  }
  const billingFreq = recurrenceRule ?? "monthly";

  // Fetch address directly from DB to ensure accuracy regardless of form serialization
  const supabase = await svc();
  const { data: contactRow } = await supabase
    .from("contacts")
    .select("address")
    .eq("id", contact_id)
    .single();
  const location = contactRow?.address || contact_address || undefined;

  try {
    const { createCalendarEvent, RECURRING_WORK_COLOR_ID, ONE_OFF_WORK_COLOR_ID } = await import("@/lib/google-calendar");
    const colorId = frequency ? RECURRING_WORK_COLOR_ID : ONE_OFF_WORK_COLOR_ID;
    const eventId = await createCalendarEvent({
      title,
      description: description ?? undefined,
      location,
      startTime:   dateOnly,
      endTime:     nextDateStr,
      isAllDay:    true,
      colorId,
      recurrenceRule,
    });

    await supabase.from("calendar_contact_links").insert({
      gcal_event_id:       eventId,
      contact_id,
      vessel_id:           vessel_id || null,
      service_template_id: template_id || null,
      service_label,
      invoice_qty:         qty,
      invoice_rate:        rate,
      invoice_discount:    discount,
      invoice_amount:      amount,
      auto_invoice:        true,
      billing_frequency:   billingFreq,
      event_type:          "work",
      color_id:            colorId,
      recurrence_rule:     recurrenceRule ?? null,
    });

    revalidatePath("/pro/calendar");
    revalidatePath("/pro/pipeline");
    return { success: true, eventId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create service event." };
  }
}

export async function createSalesMeetingEvent(
  _prev: NewEventState,
  formData: FormData
): Promise<NewEventState> {
  const contact_id      = formData.get("contact_id")       as string;
  const contact_name    = formData.get("contact_name")     as string;
  const contact_address = formData.get("contact_address")  as string | null;
  const vessel_name     = formData.get("vessel_name")      as string | null;
  const vessel_id       = formData.get("vessel_id")        as string | null;
  const start_time      = formData.get("start_time")       as string;
  const end_time        = formData.get("end_time")         as string;
  const is_all_day      = formData.get("is_all_day")       === "true";
  const description     = formData.get("description")      as string | null;

  if (!contact_id || !start_time) {
    return { error: "Contact and date are required." };
  }

  const nameParts = [contact_name.trim(), vessel_name?.trim(), "Sales Meeting"].filter(Boolean);
  const title = nameParts.join(" - ");

  function nextDay(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${next.getFullYear()}-${p(next.getMonth() + 1)}-${p(next.getDate())}`;
  }

  // Fetch address directly from DB
  const supabase = await svc();
  const { data: contactRow } = await supabase
    .from("contacts")
    .select("address")
    .eq("id", contact_id)
    .single();
  const location = contactRow?.address || contact_address || undefined;

  try {
    const { createCalendarEvent, SALES_EVENT_COLOR_ID } = await import("@/lib/google-calendar");
    const eventId = await createCalendarEvent({
      title,
      description: description ?? undefined,
      location,
      startTime:   start_time,
      endTime:     is_all_day ? nextDay(start_time.split("T")[0]) : end_time,
      isAllDay:    is_all_day,
      colorId:     SALES_EVENT_COLOR_ID,
    });

    await supabase.from("calendar_contact_links").insert({
      gcal_event_id: eventId,
      contact_id,
      vessel_id:     vessel_id || null,
      auto_invoice:  false,
      event_type:    "sales_meeting",
      color_id:      SALES_EVENT_COLOR_ID,
    });

    revalidatePath("/pro/calendar");
    revalidatePath("/pro/pipeline");
    return { success: true, eventId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create sales meeting." };
  }
}

export async function createBlankCalendarEvent(
  _prev: NewEventState,
  formData: FormData
): Promise<NewEventState> {
  const contact_id  = formData.get("contact_id")  as string | null;
  const title       = formData.get("title")        as string;
  const start_time  = formData.get("start_time")   as string;
  const end_time    = formData.get("end_time")     as string;
  const is_all_day  = formData.get("is_all_day")   === "true";
  const color_id    = formData.get("color_id")     as string | null;
  const description = formData.get("description")  as string | null;
  const location    = formData.get("location")     as string | null;

  if (!title || !start_time || !end_time) {
    return { error: "Title and date/time are required." };
  }

  function nextDay(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${next.getFullYear()}-${p(next.getMonth() + 1)}-${p(next.getDate())}`;
  }

  try {
    const { createCalendarEvent } = await import("@/lib/google-calendar");
    const eventId = await createCalendarEvent({
      title,
      description: description ?? undefined,
      location:    location    ?? undefined,
      startTime:   start_time,
      endTime:     is_all_day ? nextDay(end_time) : end_time,
      isAllDay:    is_all_day,
      colorId:     color_id ?? undefined,
    });

    if (contact_id) {
      const supabase = await svc();
      await supabase.from("calendar_contact_links").insert({
        gcal_event_id: eventId,
        contact_id,
        auto_invoice:  false,
        event_type:    "generic",
        color_id:      color_id ?? null,
      });
    }

    revalidatePath("/pro/calendar");
    revalidatePath("/pro/pipeline");
    return { success: true, eventId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create calendar event." };
  }
}

// Delete a single occurrence of a recurring event series (leaves master intact)
export async function deleteCalendarEventInstance(instanceId: string): Promise<{ error?: string }> {
  try {
    const { deleteCalendarEvent } = await import("@/lib/google-calendar");
    await deleteCalendarEvent(instanceId);
    revalidatePath("/pro/calendar");
    revalidatePath("/pro/pipeline");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete event instance." };
  }
}

// Delete an entire recurring series by master event ID
export async function deleteCalendarEventSeries(masterEventId: string): Promise<{ error?: string }> {
  try {
    const { deleteCalendarEvent } = await import("@/lib/google-calendar");
    await deleteCalendarEvent(masterEventId);
    // Also clean up the calendar_contact_links row
    const supabase = await svc();
    await supabase.from("calendar_contact_links").delete().eq("gcal_event_id", masterEventId);
    revalidatePath("/pro/calendar");
    revalidatePath("/pro/pipeline");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete event series." };
  }
}

// Update a single occurrence of a recurring event series (creates exception in GCal)
export async function updateCalendarEventInstance(
  _prev: CalendarEventState,
  formData: FormData
): Promise<CalendarEventState> {
  const event_id    = formData.get("event_id")    as string;
  const title       = formData.get("title")       as string;
  const start_time  = formData.get("start_time")  as string;
  const end_time    = formData.get("end_time")     as string;
  const description = formData.get("description") as string | null;
  const location    = formData.get("location")    as string | null;
  const is_all_day  = formData.get("is_all_day")  === "true";
  const color_id    = formData.get("color_id")    as string | null;

  if (!event_id || !title || !start_time || !end_time) return { error: "Missing required fields." };

  try {
    const { updateCalendarEventInstance: updateInstance } = await import("@/lib/google-calendar");
    await updateInstance(event_id, {
      title,
      description: description ?? undefined,
      location:    location    ?? undefined,
      startTime:   start_time,
      endTime:     end_time,
      isAllDay:    is_all_day,
      colorId:     color_id ?? undefined,
    });
    revalidatePath("/pro/calendar");
    revalidatePath("/pro/pipeline");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update event instance." };
  }
}

// ─── Schedule Job from Invoice ────────────────────────────────────────────────

export type ScheduleJobState = { error?: string; success?: boolean; eventId?: string };

export async function scheduleJobFromInvoice(
  _prev: ScheduleJobState,
  formData: FormData
): Promise<ScheduleJobState> {
  const contact_id    = formData.get("contact_id")    as string;
  const contact_name  = formData.get("contact_name")  as string | null;
  const qb_invoice_id = formData.get("qb_invoice_id") as string;
  const doc_number    = formData.get("doc_number")    as string | null;
  const title         = formData.get("title")         as string;
  const start_time    = formData.get("start_time")    as string;
  const end_time      = formData.get("end_time")      as string;
  const description   = formData.get("description")   as string | null;
  const location      = formData.get("location")      as string | null;
  const is_all_day    = formData.get("is_all_day")    === "true";

  if (!contact_id || !title || !start_time || !end_time) {
    return { error: "Missing required fields." };
  }

  function nextDay(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${next.getFullYear()}-${p(next.getMonth() + 1)}-${p(next.getDate())}`;
  }

  try {
    const { createCalendarEvent } = await import("@/lib/google-calendar");
    const eventId = await createCalendarEvent({
      title,
      description: description ?? undefined,
      location:    location    ?? undefined,
      startTime:   start_time,
      endTime:     is_all_day ? nextDay(end_time) : end_time,
      isAllDay:    is_all_day,
      qbInvoiceId: qb_invoice_id,
    });

    const supabase = await svc();
    await supabase.from("timeline_events").insert({
      contact_id,
      event_type: "appointment_scheduled",
      title: `Job Scheduled from Invoice`,
      body: `${title}`,
      metadata: {
        google_event_id: eventId,
        qb_invoice_id,
        doc_number: doc_number ?? null,
        start_time,
        end_time,
        location: location ?? null,
        linked_from: "invoice_timeline",
      },
      created_by: "pro",
    });

    revalidatePath(`/pro/contacts/${contact_id}`);
    revalidatePath("/pro/calendar");
    return { success: true, eventId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to schedule job." };
  }
}

// ─── Delete Contact ───────────────────────────────────────────────────────────

export async function deleteContact(contactId: string): Promise<{ error?: string }> {
  const supabase = await svc();

  // Fetch external IDs before deleting
  const { data: contact } = await supabase
    .from("contacts")
    .select("openphone_contact_id, qb_customer_id")
    .eq("id", contactId)
    .single();

  // Cascade: vessels, linked_contacts, and timeline_events should be set up
  // with ON DELETE CASCADE in Supabase, but delete children explicitly to be safe
  await supabase.from("vessels").delete().eq("owner_id", contactId);
  await supabase.from("linked_contacts").delete().eq("primary_contact_id", contactId);
  await supabase.from("timeline_events").delete().eq("contact_id", contactId);
  const { error } = await supabase.from("contacts").delete().eq("id", contactId);
  if (error) return { error: error.message };
  revalidatePath("/pro/contacts");

  // Clean up external systems in the background
  if (contact?.openphone_contact_id) {
    (async () => {
      try {
        const { deleteOpenPhoneContact } = await import("@/lib/openphone");
        await deleteOpenPhoneContact(contact.openphone_contact_id!);
      } catch { /* non-fatal */ }
    })();
  }
  if (contact?.qb_customer_id) {
    (async () => {
      try {
        const { getQbTokens, inactivateQbCustomer } = await import("@/lib/quickbooks");
        const tokens = await getQbTokens();
        if (tokens) await inactivateQbCustomer(contact.qb_customer_id!);
      } catch { /* non-fatal */ }
    })();
  }

  return {};
}

// ─── Delete Lead ─────────────────────────────────────────────────────────────

export async function deleteLead(leadId: string): Promise<{ error?: string }> {
  const supabase = await svc();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/pro/leads");
  revalidatePath("/pro/pipeline");
  return {};
}

// ─── QuickBooks Invoice Auto-Schedule (hook stub) ─────────────────────────────
// Call this from the QB webhook handler once QBO_CLIENT_ID, QBO_CLIENT_SECRET,
// QBO_REALM_ID, and QBO_REFRESH_TOKEN are configured in Vercel env vars.
// ─── Pipeline Board ──────────────────────────────────────────────────────────

import type { PipelineStage } from "@/types/pipeline";

export async function updatePipelineStage(
  id: string,
  sourceType: "contact" | "lead",
  newStage: PipelineStage
): Promise<{ ok: boolean; contactId?: string; contactName?: string; vesselName?: string; error?: string }> {
  const supabase = await svc();

  if (sourceType === "lead") {
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("id, name, email, phone, vessel_type, vessel_length, source, waiver_signed")
      .eq("id", id)
      .single();
    if (leadErr || !lead) return { ok: false, error: "Lead not found." };

    let contactId: string | null = null;
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", lead.email)
      .maybeSingle();

    if (existing) {
      contactId = existing.id;
      await supabase.from("contacts").update({
        ...(lead.name  ? { name: lead.name }  : {}),
        ...(lead.phone ? { phone: normalizePhone(lead.phone) ?? lead.phone } : {}),
        pipeline_stage: newStage,
        stage_entered_at: new Date().toISOString(),
        status: "client",
      }).eq("id", contactId);
    } else {
      const { data: newContact, error: cErr } = await supabase
        .from("contacts")
        .insert({
          name: lead.name, email: lead.email,
          phone: normalizePhone(lead.phone),
          vessel_type: lead.vessel_type, vessel_length: lead.vessel_length,
          waiver_signed: lead.waiver_signed ?? false,
          source: lead.source ?? "website",
          status: "client",
          pipeline_stage: newStage,
          stage_entered_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (cErr || !newContact) return { ok: false, error: cErr?.message ?? "Failed to create contact." };
      contactId = newContact.id;
    }

    if (contactId) await insertVessel(supabase, contactId, lead);

    await supabase.from("timeline_events").insert({
      contact_id: contactId,
      event_type: "lead_converted",
      title: "Converted via Pipeline board",
      body: `Lead moved to ${newStage.replace(/_/g, " ")} stage.`,
      created_by: "pro",
    });

    await supabase.from("leads").update({ status: "converted" }).eq("id", id);

    const { data: vessel } = await supabase
      .from("vessels")
      .select("name")
      .eq("owner_id", contactId!)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    revalidatePath("/pro/leads");
    return { ok: true, contactId: contactId!, contactName: lead.name ?? "Unknown", vesselName: vessel?.name ?? null };
  }

  // Contact
  const { data: contact, error: cErr } = await supabase
    .from("contacts")
    .select("id, name, pipeline_stage")
    .eq("id", id)
    .single();
  if (cErr || !contact) return { ok: false, error: "Contact not found." };

  const updatePayload: Record<string, unknown> = { pipeline_stage: newStage, stage_entered_at: new Date().toISOString() };
  if (contact.pipeline_stage === "needs_attention") {
    updatePayload.health_flags = [];
  }
  const { error: updateErr } = await supabase.from("contacts").update(updatePayload).eq("id", id);
  if (updateErr) return { ok: false, error: updateErr.message };

  const { data: vessel } = await supabase
    .from("vessels")
    .select("name")
    .eq("owner_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { ok: true, contactId: id, contactName: contact.name ?? "Unknown", vesselName: vessel?.name ?? null };
}

export async function removeFromPipeline(contactId: string): Promise<{ ok: boolean }> {
  const supabase = await svc();
  await supabase.from("contacts").update({ pipeline_stage: null }).eq("id", contactId);
  revalidatePath("/pro/pipeline");
  return { ok: true };
}

export async function createQuickBooksInvoiceDraft(
  contactId: string,
  assetId?: string
): Promise<{ invoiceId?: string; invoiceUrl?: string; docNumber?: string; error?: string }> {
  const supabase = await svc();
  const { data: contact, error } = await supabase
    .from("contacts")
    .select("id, name, email, phone")
    .eq("id", contactId)
    .single();
  if (error || !contact) return { error: "Contact not found." };

  const { data: vessel } = assetId
    ? await supabase.from("vessels").select("name, make_model, length_ft").eq("id", assetId).maybeSingle()
    : await supabase.from("vessels").select("name, make_model, length_ft").eq("owner_id", contactId).order("created_at", { ascending: false }).limit(1).maybeSingle();

  try {
    const { findOrCreateQbCustomer, createQbInvoiceDraft, getQbInvoiceUrl, getQbTokens } = await import("@/lib/quickbooks");
    const tokens = await getQbTokens();
    if (!tokens) return { error: "QuickBooks not connected. Visit Integrations to authorize." };

    const qbCustomerId = await findOrCreateQbCustomer({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
    });

    const assetDesc = vessel
      ? [vessel.name, vessel.make_model, vessel.length_ft ? `${vessel.length_ft.replace(/ft$/i, "").trim()}ft` : null].filter(Boolean).join(" ")
      : "Marine Services";

    const { invoiceId, docNumber } = await createQbInvoiceDraft({
      qbCustomerId,
      lineDescription: `Services: ${assetDesc}`,
    });

    const invoiceUrl = getQbInvoiceUrl(tokens.realm_id, invoiceId);

    await supabase.from("timeline_events").insert({
      contact_id:  contactId,
      event_type:  "invoice",
      title:       "Draft Invoice Created",
      body:        `QB Invoice #${docNumber} created for ${assetDesc}.`,
      metadata:    { qb_invoice_id: invoiceId, doc_number: docNumber, asset_id: assetId ?? null },
      created_by:  "pro",
    });

    revalidatePath(`/pro/contacts/${contactId}`);
    return { invoiceId, invoiceUrl, docNumber };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create invoice." };
  }
}

// ─── Conflict Detection ───────────────────────────────────────────────────────

// ─── QuickBooks Contact Sync ──────────────────────────────────────────────────

export async function syncContactToQuickBooks(
  contactId: string
): Promise<{ ok: boolean; qbCustomerId?: string; error?: string }> {
  const supabase = await svc();
  const { data: contact, error } = await supabase
    .from("contacts")
    .select("id, name, email, phone")
    .eq("id", contactId)
    .single();
  if (error || !contact) return { ok: false, error: "Contact not found." };

  try {
    const { findOrCreateQbCustomer, getQbTokens } = await import("@/lib/quickbooks");
    const tokens = await getQbTokens();
    if (!tokens) return { ok: false, error: "QuickBooks not connected." };

    const qbCustomerId = await findOrCreateQbCustomer({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
    });

    revalidatePath(`/pro/contacts/${contactId}`);
    return { ok: true, qbCustomerId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Sync failed." };
  }
}

export async function pushCrmToQuickBooks(): Promise<{ upserted: number; skipped: string[]; error?: string }> {
  const supabase = await svc();
  try {
    const { findOrCreateQbCustomer, getQbTokens } = await import("@/lib/quickbooks");
    const tokens = await getQbTokens();
    if (!tokens) return { upserted: 0, skipped: [], error: "QuickBooks not connected." };

    // Only push contacts not yet in QB — linked contacts are kept in sync by QB webhooks
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, name, company_name, email, phone")
      .eq("contact_type", "customer")
      .not("name", "is", null)
      .is("qb_customer_id", null);

    let upserted = 0;
    const skipped: string[] = [];
    for (const c of contacts ?? []) {
      const qbId = await findOrCreateQbCustomer({ id: c.id, name: c.name, company_name: c.company_name, email: c.email, phone: c.phone });
      if (qbId) { upserted++; } else { skipped.push(c.name ?? c.id); }
    }
    return { upserted, skipped };
  } catch (err) {
    return { upserted: 0, skipped: [], error: err instanceof Error ? err.message : "QB push failed." };
  }
}

export async function syncVesselsToQbNotes(): Promise<{ synced: number; error?: string }> {
  const supabase = await svc();
  try {
    const { getQbTokens, getQbCustomer, buildCustomFieldVessels, updateQbCustomerCustomFields } = await import("@/lib/quickbooks");
    const tokens = await getQbTokens();
    if (!tokens) return { synced: 0, error: "QuickBooks not connected." };

    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, qb_customer_id")
      .not("qb_customer_id", "is", null);

    // Pre-fetch all vessels in one query and group by owner
    const allContactIds = (contacts ?? []).map((c) => c.id);
    const { data: allVessels } = allContactIds.length > 0
      ? await supabase.from("vessels").select("owner_id, year, make_model, length_ft").in("owner_id", allContactIds).order("created_at", { ascending: true })
      : { data: [] };
    const vesselsByOwner = new Map<string, typeof allVessels>();
    for (const v of allVessels ?? []) {
      const list = vesselsByOwner.get(v.owner_id) ?? [];
      list.push(v);
      vesselsByOwner.set(v.owner_id, list);
    }

    let synced = 0;
    const results = await pMap(contacts ?? [], async (c) => {
      try {
        const vessels = vesselsByOwner.get(c.id) ?? [];
        const noteVessels = vessels.map((v) => ({
          year: v.year as number | null,
          makeModel: v.make_model as string | null,
          lengthFt: v.length_ft ? `${(v.length_ft as string).replace(/\s*ft\s*$/i, "")}ft` : null,
        }));
        const customer = await getQbCustomer(c.qb_customer_id!);
        const existingFields = (customer.CustomField as { DefinitionId: string }[] | undefined) ?? [];
        if (existingFields.length === 0) return 0; // no custom fields defined in QB for this account
        const newFields = buildCustomFieldVessels(existingFields, noteVessels);
        await updateQbCustomerCustomFields(c.qb_customer_id!, customer.SyncToken!, newFields);
        return 1;
      } catch { /* skip */ }
      return 0;
    }, 5);
    synced = results.reduce((a: number, b: number) => a + b, 0);

    return { synced };
  } catch (err) {
    return { synced: 0, error: err instanceof Error ? err.message : "QB notes sync failed." };
  }
}

export async function clearQbNotes(): Promise<{ cleared: number; errors: string[]; error?: string }> {
  const supabase = await svc();
  try {
    const { getQbTokens, getQbCustomer, updateQbCustomerNotes } = await import("@/lib/quickbooks");
    const tokens = await getQbTokens();
    if (!tokens) return { cleared: 0, errors: [], error: "QuickBooks not connected." };

    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, name, qb_customer_id")
      .not("qb_customer_id", "is", null);

    if (!contacts?.length) return { cleared: 0, errors: [] };

    const rowErrors: string[] = [];
    const results = await pMap(contacts, async (c) => {
      try {
        const customer = await getQbCustomer(c.qb_customer_id!);
        if (!customer.Notes?.trim()) return 0;
        await updateQbCustomerNotes(c.qb_customer_id!, customer.SyncToken!, "");
        return 1;
      } catch (err) {
        rowErrors.push(`${c.name ?? c.qb_customer_id}: ${err instanceof Error ? err.message : String(err)}`);
        return 0;
      }
    }, 2);

    return { cleared: results.reduce((a: number, b: number) => a + b, 0), errors: rowErrors };
  } catch (err) {
    return { cleared: 0, errors: [], error: err instanceof Error ? err.message : "Failed." };
  }
}

// ─── Manual Call Log ──────────────────────────────────────────────────────────

export async function logManualCall(
  contactId: string,
  direction: "inbound" | "outbound",
  notes: string
): Promise<{ ok: boolean; error?: string }> {
  if (!notes.trim()) return { ok: false, error: "Notes are required." };
  const supabase = await svc();
  const session = await createServerSupabase();
  const { data: { user } } = await session.auth.getUser();
  const email = user?.email ?? "";
  const createdBy = email.split("@")[0] || "pro";

  const { error } = await supabase.from("timeline_events").insert({
    contact_id:  contactId,
    event_type:  "call",
    title:       direction === "outbound" ? "Outbound Call" : "Inbound Call",
    body:        notes.trim(),
    metadata:    { direction, source: "manual" },
    created_by:  createdBy,
  });

  if (error) return { ok: false, error: error.message };

  await supabase
    .from("contacts")
    .update({ last_contact_at: new Date().toISOString() })
    .eq("id", contactId);

  revalidatePath(`/pro/contacts/${contactId}`);
  return { ok: true };
}

// ─── Integrity Engine ─────────────────────────────────────────────────────────

type IntegrityFlag = { type: string; label: string };

export async function runIntegrityCheck(): Promise<{ checked: number; flagged: number; error?: string }> {
  const supabase = await svc();

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("id, pipeline_stage, qb_customer_id, waiver_signed, vessels ( id )")
    .eq("contact_type", "customer")
    .not("pipeline_stage", "in", '("done_invoiced","paid")');

  if (error) return { checked: 0, flagged: 0, error: error.message };
  if (!contacts?.length) return { checked: 0, flagged: 0 };

  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

  // Batch-fetch all recent timeline events for all contacts in one query
  const contactIds = contacts.map((c) => c.id);
  const { data: allRecentEvents } = await supabase
    .from("timeline_events")
    .select("id, contact_id, metadata")
    .in("contact_id", contactIds)
    .in("event_type", ["call", "sms"])
    .gte("created_at", fourHoursAgo)
    .order("created_at", { ascending: false });

  const eventsByContact = new Map<string, { id: string; contact_id: string; metadata: unknown }[]>();
  for (const ev of allRecentEvents ?? []) {
    const list = eventsByContact.get(ev.contact_id) ?? [];
    list.push(ev);
    eventsByContact.set(ev.contact_id, list);
  }

  // Process contacts with bounded concurrency to avoid DB pool exhaustion during Sync All
  const results = await pMap(contacts, async (contact) => {
    const flags: IntegrityFlag[] = [];

    if (!contact.qb_customer_id) {
      flags.push({ type: "missing_qb", label: "No QB Link" });
    }

    if (!contact.waiver_signed && contact.pipeline_stage === "work_scheduled") {
      flags.push({ type: "missing_waiver", label: "Unsigned Waiver" });
    }

    const vessels = Array.isArray(contact.vessels) ? contact.vessels : [];
    if (vessels.length === 0) {
      flags.push({ type: "incomplete_profile", label: "Vessel Missing" });
    }

    const recentEvents = eventsByContact.get(contact.id) ?? [];
    if (recentEvents.length > 0) {
      const hasUnrepliedInbound = recentEvents.some(
        (ev) => (ev.metadata as Record<string, unknown> | null)?.direction === "inbound"
      );
      const hasOutbound = recentEvents.some(
        (ev) => (ev.metadata as Record<string, unknown> | null)?.direction === "outbound"
      );
      if (hasUnrepliedInbound && !hasOutbound) {
        flags.push({ type: "comms_gap", label: "Unreturned Message" });
      }
    }

    const hadFlags = flags.length > 0;

    await supabase
      .from("contacts")
      .update({
        health_flags: flags,
        ...(hadFlags && contact.pipeline_stage !== "needs_attention"
          ? { pipeline_stage: "needs_attention" }
          : {}),
      })
      .eq("id", contact.id);

    return hadFlags;
  }, 10);

  const flagged = results.filter(Boolean).length;

  revalidatePath("/pro/pipeline");
  return { checked: contacts.length, flagged };
}

// ─── QuickBooks Customer Import ───────────────────────────────────────────────

export type FieldMismatch = {
  contactId: string;
  contactName: string | null;
  field: "name" | "email" | "phone";
  crmValue: string | null;
  sourceValue: string;
};

export async function importQbCustomers(): Promise<{
  linked: number;
  alreadyLinked: number;
  unmatched: QbUnmatched[];
  mismatches: FieldMismatch[];
  error?: string;
}> {
  const supabase = await svc();

  try {
    const { listQbCustomers, getQbTokens, parseVesselsFromCustomFields, parseVesselsFromNotes } = await import("@/lib/quickbooks");
    const tokens = await getQbTokens();
    if (!tokens) return { linked: 0, alreadyLinked: 0, unmatched: [], mismatches: [], error: "QuickBooks not connected." };

    const qbCustomers = await listQbCustomers();

    const { data: crmContacts } = await supabase
      .from("contacts")
      .select("id, name, company_name, email, phone, address, qb_customer_id");

    const contacts = crmContacts ?? [];
    const emailMap = new Map(contacts.filter(c => c.email).map(c => [c.email!.toLowerCase(), c]));
    const nameMap  = new Map(contacts.filter(c => c.name).map(c => [c.name!.toLowerCase().trim(), c]));

    let linked = 0;
    let alreadyLinked = 0;
    const unmatched: QbUnmatched[] = [];
    const mismatches: FieldMismatch[] = [];

    for (const qbC of qbCustomers) {
      const qbEmailRaw = qbC.PrimaryEmailAddr?.Address;
      const qbPhoneRaw = qbC.PrimaryPhone?.FreeFormNumber;
      const qbEmail = qbEmailRaw?.toLowerCase();
      const qbName  = qbC.DisplayName?.toLowerCase().trim();

      const emailMatch = qbEmail ? emailMap.get(qbEmail) : undefined;
      const nameMatch  = !emailMatch && qbName ? nameMap.get(qbName) : undefined;
      const match = emailMatch ?? nameMatch;

      if (match) {
        // Compare all fields and collect mismatches
        if (nameMatch && qbEmailRaw && qbEmailRaw.toLowerCase() !== (match.email?.toLowerCase() ?? "")) {
          mismatches.push({ contactId: match.id, contactName: match.name, field: "email", crmValue: match.email, sourceValue: qbEmailRaw });
        }
        if (qbPhoneRaw) {
          const normQb = normalizePhone(qbPhoneRaw) ?? qbPhoneRaw;
          if (normQb !== (match.phone ?? "")) {
            mismatches.push({ contactId: match.id, contactName: match.name, field: "phone", crmValue: match.phone, sourceValue: normQb });
          }
        }

        const billAddr = qbC.BillAddr;
        const addressParts = [
          billAddr?.Line1,
          billAddr?.Line2,
          billAddr?.City && billAddr?.CountrySubDivisionCode
            ? `${billAddr.City}, ${billAddr.CountrySubDivisionCode}${billAddr.PostalCode ? " " + billAddr.PostalCode : ""}`
            : billAddr?.City,
        ].filter(Boolean);
        const formattedAddress = addressParts.length ? addressParts.join(", ") : null;

        const updatePayload: Record<string, unknown> = { qb_customer_id: qbC.Id };
        if (formattedAddress && !match.address) updatePayload.address = formattedAddress;
        if (qbC.CompanyName?.trim() && !(match as Record<string, unknown>).company_name) updatePayload.company_name = qbC.CompanyName.trim();

        if (match.qb_customer_id === qbC.Id && !updatePayload.address) {
          alreadyLinked++;
        } else {
          await supabase.from("contacts").update(updatePayload).eq("id", match.id);
          linked++;
        }

        // Sync vessels: custom fields first, Notes as fallback for legacy data
        const rawCFs = (qbC.CustomField as unknown[] | undefined) ?? [];
        const noteVessels = rawCFs.length > 0
          ? parseVesselsFromCustomFields(rawCFs)
          : parseVesselsFromNotes(qbC.Notes ?? null);
        if (noteVessels.length > 0) {
          const { data: existing } = await supabase
            .from("vessels")
            .select("make_model, year, length_ft, name")
            .eq("owner_id", match.id);
          const existingKeys = new Set(
            (existing ?? []).flatMap((v) => {
              const byMakeModel = `${v.year ?? ""}|${v.make_model?.toLowerCase() ?? ""}`;
              const byName      = `name|${v.name?.toLowerCase() ?? ""}`;
              const byLength    = `len|${v.length_ft?.toLowerCase() ?? ""}|${v.make_model?.toLowerCase() ?? ""}`;
              return [byMakeModel, byName, byLength];
            })
          );
          for (const nv of noteVessels) {
            const key = `${nv.year ?? ""}|${nv.makeModel?.toLowerCase() ?? ""}`;
            if (!existingKeys.has(key)) {
              await supabase.from("vessels").insert({
                owner_id: match.id, asset_type: "vessel",
                year: nv.year, make_model: nv.makeModel, length_ft: nv.lengthFt?.replace(/\s*ft\s*$/i, "").trim() || null,
              });
            }
          }
        }
      } else {
        unmatched.push({
          qbId:        qbC.Id,
          name:        qbC.DisplayName,
          email:       qbEmailRaw ?? null,
          phone:       qbPhoneRaw ?? null,
          companyName: qbC.CompanyName ?? null,
        });
      }
    }

    revalidatePath("/pro/contacts");
    revalidatePath("/pro/pipeline");
    return { linked, alreadyLinked, unmatched, mismatches };
  } catch (err) {
    return { linked: 0, alreadyLinked: 0, unmatched: [], mismatches: [], error: err instanceof Error ? err.message : "Import failed." };
  }
}

type QbUnmatched = { qbId: string; name: string; email: string | null; phone: string | null; companyName: string | null };

export async function importQbInvoices(): Promise<{ imported: number; skipped: number; error?: string }> {
  const supabase = await svc();
  try {
    const { listQbTransactionsForCustomer, getQbTokens, getQbInvoiceUrl } = await import("@/lib/quickbooks");
    const tokens = await getQbTokens();
    if (!tokens) return { imported: 0, skipped: 0, error: "QuickBooks not connected." };

    const realmId = (tokens as { realmId?: string }).realmId ?? "";

    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, name, qb_customer_id")
      .not("qb_customer_id", "is", null);

    if (!contacts?.length) return { imported: 0, skipped: 0 };

    // Deduplicate per-contact: key is "contactId:txnId" so an invoice on the wrong
    // contact doesn't permanently block it from being imported under the correct one.
    const { data: existing } = await supabase
      .from("timeline_events")
      .select("contact_id, metadata")
      .in("event_type", ["invoice", "payment", "sales_receipt", "credit_memo"]);

    const importedIds = new Set<string>();
    for (const e of existing ?? []) {
      const meta = e.metadata as { qb_txn_id?: string; qb_invoice_id?: string };
      const cid = e.contact_id as string;
      if (meta?.qb_txn_id) importedIds.add(`${cid}:${meta.qb_txn_id}`);
      if (meta?.qb_invoice_id) importedIds.add(`${cid}:Invoice:${meta.qb_invoice_id}`);
    }

    const typeLabels: Record<string, string> = {
      Invoice:     "Invoice",
      Payment:     "Payment",
      SalesReceipt: "Sales Receipt",
      CreditMemo:  "Credit Memo",
    };
    const eventTypes: Record<string, string> = {
      Invoice:      "invoice",
      Payment:      "payment",
      SalesReceipt: "sales_receipt",
      CreditMemo:   "credit_memo",
    };

    // Fetch transactions for all contacts in parallel (QB: 5 concurrent)
    const contactTxns = await pMap(contacts, async (contact) => {
      const txns = await listQbTransactionsForCustomer(contact.qb_customer_id!);
      return { contact, txns };
    }, 5);

    // Build inserts for all new transactions
    const toInsert: object[] = [];
    let skipped = 0;

    for (const { contact, txns } of contactTxns) {
      for (const txn of txns) {
        const key = `${txn.txnType}:${txn.id}`;
        const contactKey = `${contact.id}:${key}`;
        if (importedIds.has(contactKey)) { skipped++; continue; }
        importedIds.add(contactKey);

        const label = typeLabels[txn.txnType] ?? txn.txnType;
        const docPart = txn.docNumber ? ` #${txn.docNumber}` : "";
        const invoiceUrl = txn.txnType === "Invoice" && realmId ? getQbInvoiceUrl(realmId, txn.id) : null;

        toInsert.push({
          contact_id: contact.id,
          event_type: eventTypes[txn.txnType] ?? "invoice",
          title: `${label}${docPart} — $${Math.abs(txn.totalAmt).toFixed(2)}${txn.status ? ` (${txn.status})` : ""}`,
          body: txn.body ?? "",
          metadata: {
            qb_txn_id: key,
            txn_type: txn.txnType,
            doc_number: txn.docNumber,
            total: txn.totalAmt,
            status: txn.status,
            txn_date: txn.txnDate,
            invoice_url: invoiceUrl,
          },
          created_by: "system",
          created_at: txn.txnDate,
        });
      }
    }

    // Bulk insert in batches of 50
    const BATCH = 50;
    for (let b = 0; b < toInsert.length; b += BATCH) {
      await supabase.from("timeline_events").insert(toInsert.slice(b, b + BATCH));
    }
    const imported = toInsert.length;

    revalidatePath("/pro/contacts");
    return { imported, skipped };
  } catch (err) {
    return { imported: 0, skipped: 0, error: err instanceof Error ? err.message : "Import failed." };
  }
}

// ── QB Invoice Reconcile: remove stale CRM timeline entries, update statuses ──

export async function reconcileQbInvoices(): Promise<{ removed: number; updated: number; error?: string }> {
  const supabase = await svc();
  try {
    const { listQbTransactionsForCustomer, getQbTokens } = await import("@/lib/quickbooks");
    const tokens = await getQbTokens();
    if (!tokens) return { removed: 0, updated: 0, error: "QuickBooks not connected." };

    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, qb_customer_id")
      .not("qb_customer_id", "is", null);

    if (!contacts?.length) return { removed: 0, updated: 0 };

    const { data: existing } = await supabase
      .from("timeline_events")
      .select("id, contact_id, title, metadata")
      .in("event_type", ["invoice", "payment", "sales_receipt", "credit_memo"])
      .not("metadata->qb_txn_id", "is", null);

    if (!existing?.length) return { removed: 0, updated: 0 };

    // Group existing CRM events by contact_id
    const byContact = new Map<string, typeof existing>();
    for (const e of existing) {
      const cid = e.contact_id as string;
      if (!byContact.has(cid)) byContact.set(cid, []);
      byContact.get(cid)!.push(e);
    }

    const contactsWithEvents = contacts.filter((c) => byContact.has(c.id));

    // Fetch current QB transactions for all relevant contacts
    const contactTxns = await pMap(contactsWithEvents, async (contact) => {
      const txns = await listQbTransactionsForCustomer(contact.qb_customer_id!);
      return { contactId: contact.id, txns };
    }, 5);

    const typeLabels: Record<string, string> = {
      Invoice: "Invoice", Payment: "Payment", SalesReceipt: "Sales Receipt", CreditMemo: "Credit Memo",
    };

    const toDelete: string[] = [];
    const toUpdate: { id: string; title: string; metadata: Record<string, unknown> }[] = [];

    for (const { contactId, txns } of contactTxns) {
      const events = byContact.get(contactId) ?? [];
      const liveKeys = new Map(txns.map((t) => [`${t.txnType}:${t.id}`, t]));

      for (const ev of events) {
        const meta = ev.metadata as { qb_txn_id?: string; status?: string; total?: number; doc_number?: string; invoice_url?: string; txn_date?: string; txn_type?: string } | null;
        const txnKey = meta?.qb_txn_id;
        if (!txnKey) continue;

        const live = liveKeys.get(txnKey);
        if (!live) {
          // No longer in QB — deleted or voided
          toDelete.push(ev.id as string);
        } else {
          // Check if status or amount changed
          const newStatus = live.status ?? null;
          const newTotal = live.totalAmt;
          if (newStatus !== (meta?.status ?? null) || newTotal !== (meta?.total ?? null)) {
            const label = typeLabels[live.txnType] ?? live.txnType;
            const docPart = live.docNumber ? ` #${live.docNumber}` : "";
            toUpdate.push({
              id: ev.id as string,
              title: `${label}${docPart} — $${Math.abs(newTotal).toFixed(2)}${newStatus ? ` (${newStatus})` : ""}`,
              metadata: { ...meta, status: newStatus, total: newTotal },
            });
          }
        }
      }
    }

    if (toDelete.length) {
      await supabase.from("timeline_events").delete().in("id", toDelete);
    }
    for (const u of toUpdate) {
      await supabase.from("timeline_events").update({ title: u.title, metadata: u.metadata }).eq("id", u.id);
    }

    revalidatePath("/pro/contacts");
    return { removed: toDelete.length, updated: toUpdate.length };
  } catch (err) {
    return { removed: 0, updated: 0, error: err instanceof Error ? err.message : "Reconcile failed." };
  }
}

// ── QB Vessel Sync: QB → CRM ──────────────────────────────────────────────────


function parseVesselsFromCompanyName(companyName: string): { name: string; asset_type: string; length_ft: number | null }[] {
  return companyName
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const lenMatch = s.match(/(\d+\.?\d*)\s*(?:ft|feet|')\s*$/i);
      const length_ft = lenMatch ? parseFloat(lenMatch[1]) : null;
      const vesselName = lenMatch ? s.slice(0, -lenMatch[0].length).trim() : s;
      return { name: vesselName || s, asset_type: "boat", length_ft };
    });
}

export async function createContactFromQb(
  qbId: string, name: string, email: string | null, phone: string | null, companyName?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await svc();
  const { data: newContact, error } = await supabase.from("contacts").insert({
    name,
    email,
    phone: normalizePhone(phone),
    qb_customer_id: qbId,
    source: "quickbooks",
    status: "client",
    contact_type: companyName?.trim() ? "vendor" : "customer",
    // Established QB customers live in Contacts only, not on the pipeline board.
    // They are added to the board manually when there's actual work, so they
    // never show up mislabeled as a brand-new lead.
    pipeline_stage: null,
    waiver_signed: false,
  }).select("id").single();
  if (error || !newContact) return { ok: false, error: error?.message ?? "Insert failed." };

  if (companyName?.trim()) {
    const vessels = parseVesselsFromCompanyName(companyName);
    for (const v of vessels) {
      await supabase.from("vessels").insert({ owner_id: newContact.id, ...v });
    }
  }

  revalidatePath("/pro/contacts");
  revalidatePath("/pro/pipeline");
  return { ok: true };
}

// ─── Quo Sync ─────────────────────────────────────────────────────────────────

export type OpUnmatched = { opId: string; name: string; phone: string | null; email: string | null; company: string | null };

export async function importQuoContacts(): Promise<{
  fetched: number;
  linked: number;
  alreadyLinked: number;
  unmatched: OpUnmatched[];
  error?: string;
}> {
  const supabase = await svc();
  try {
    const { listOpenPhoneContacts } = await import("@/lib/openphone");
    const opContacts = await listOpenPhoneContacts();

    const { data: crmContacts } = await supabase
      .from("contacts")
      .select("id, name, email, phone, openphone_contact_id");

    const contacts = crmContacts ?? [];
    const phoneMap = new Map(contacts.filter(c => c.phone).map(c => [normalizePhone(c.phone!) ?? c.phone!, c]));
    const emailMap = new Map(contacts.filter(c => c.email).map(c => [c.email!.toLowerCase(), c]));
    const nameMap  = new Map(contacts.filter(c => c.name).map(c => [c.name!.toLowerCase().trim(), c]));

    let linked = 0;
    let alreadyLinked = 0;
    const unmatched: OpUnmatched[] = [];

    for (const op of opContacts) {
      const opPhone = op.phoneNumbers?.[0]?.value ? normalizePhone(op.phoneNumbers[0].value) : null;
      const opEmail = op.emails?.[0]?.value?.toLowerCase() ?? null;
      const opName  = [op.firstName, op.lastName].filter(Boolean).join(" ").toLowerCase().trim();

      const match =
        (opPhone ? phoneMap.get(opPhone) : undefined) ??
        (opEmail ? emailMap.get(opEmail) : undefined) ??
        (opName  ? nameMap.get(opName)   : undefined);

      if (match) {
        if (match.openphone_contact_id === op.id) {
          alreadyLinked++;
        } else {
          await supabase.from("contacts").update({ openphone_contact_id: op.id }).eq("id", match.id);
          linked++;
        }
      } else {
        unmatched.push({
          opId:    op.id,
          name:    [op.firstName, op.lastName].filter(Boolean).join(" ") || "Unknown",
          phone:   opPhone,
          email:   op.emails?.[0]?.value ?? null,
          company: op.company ?? null,
        });
      }
    }

    return { fetched: opContacts.length, linked, alreadyLinked, unmatched };
  } catch (err) {
    return { fetched: 0, linked: 0, alreadyLinked: 0, unmatched: [], error: err instanceof Error ? err.message : "Quo import failed." };
  }
}


export async function createContactFromQuo(opId: string, name: string, phone: string | null, email: string | null, company?: string | null): Promise<{ ok: boolean; error?: string }> {
  const supabase = await svc();
  try {
    const normalized = normalizePhone(phone ?? "") ?? phone ?? null;
    const isVendor = !!company?.trim();
    const { data, error } = await supabase.from("contacts").insert({
      name,
      phone: normalized,
      email: email ?? null,
      source: "quo",
      contact_type: isVendor ? "vendor" : "customer",
      company_name: isVendor ? company!.trim() : null,
      status: "lead",
      openphone_contact_id: opId,
    }).select("id").single();
    if (error) return { ok: false, error: error.message };
    await supabase.from("timeline_events").insert({
      contact_id: data.id,
      event_type: "lead_created",
      title: "Lead created from Quo contact import",
      body: null,
      created_by: "system",
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function pushCrmToQuo(): Promise<{ updated: number; created: number; error?: string }> {
  const supabase = await svc();
  try {
    const { listOpenPhoneContacts, createOpenPhoneContact, updateOpenPhoneContact, splitName } = await import("@/lib/openphone");

    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, name, company_name, email, phone, openphone_contact_id")
      .eq("contact_type", "customer")
      .not("name", "is", null);

    const contactIds = (contacts ?? []).map((c) => c.id);
    const vesselMap = new Map<string, string>();
    if (contactIds.length > 0) {
      const { data: vessels } = await supabase
        .from("vessels")
        .select("owner_id, year, make_model")
        .in("owner_id", contactIds)
        .order("created_at", { ascending: true });
      for (const v of vessels ?? []) {
        if (!vesselMap.has(v.owner_id)) {
          const parts = [v.year, v.make_model].filter(Boolean).join(" ");
          if (parts) vesselMap.set(v.owner_id, parts);
        }
      }
    }

    // Build a phone index of existing Quo contacts to avoid duplicates on create
    const existing = await listOpenPhoneContacts();
    const existingByPhone = new Map(
      existing.flatMap((c) => (c.phoneNumbers ?? []).filter((p) => p.value).map((p) => [normalizePhone(p.value!) ?? p.value!, c.id]))
    );

    const counts = await pMap(contacts ?? [], async (c) => {
      const { firstName, lastName } = splitName(c.name ?? c.company_name ?? "");
      const vessel = vesselMap.get(c.id) ?? null;
      const payload = {
        firstName,
        lastName,
        ...(vessel ? { role: vessel } : {}),
        ...(c.email ? { emails: [{ name: "work", value: c.email }] } : {}),
        ...(c.phone ? { phoneNumbers: [{ name: "work", value: c.phone }] } : {}),
      };
      if (c.openphone_contact_id) {
        await updateOpenPhoneContact(c.openphone_contact_id, payload);
        return { updated: 1, created: 0 };
      }
      const existingId = c.phone ? existingByPhone.get(normalizePhone(c.phone) ?? c.phone) : undefined;
      if (existingId) {
        await updateOpenPhoneContact(existingId, payload);
        await supabase.from("contacts").update({ openphone_contact_id: existingId }).eq("id", c.id);
        return { updated: 1, created: 0 };
      }
      const newId = await createOpenPhoneContact(payload);
      if (newId) {
        await supabase.from("contacts").update({ openphone_contact_id: newId }).eq("id", c.id);
        return { updated: 0, created: 1 };
      }
      return { updated: 0, created: 0 };
    }, 3);

    const updated = counts.reduce((a, b) => a + b.updated, 0);
    const created = counts.reduce((a, b) => a + b.created, 0);
    return { updated, created };
  } catch (err) {
    return { updated: 0, created: 0, error: err instanceof Error ? err.message : "Quo push failed." };
  }
}

export async function purgeGhostVessels(): Promise<{ deleted: number; error?: string }> {
  const supabase = await svc();
  try {
    // Pass 1: no name, no make_model, no year (length-only or blank rows)
    const { data: pass1 } = await supabase
      .from("vessels")
      .delete()
      .is("name", null)
      .is("make_model", null)
      .is("year", null)
      .select("id");

    // Pass 2: length value ended up in the make_model slot (e.g. "52ft", "22ft")
    // Fetch candidates and filter in code to avoid regex dependency on DB
    const { data: candidates } = await supabase
      .from("vessels")
      .select("id, make_model")
      .is("name", null)
      .is("year", null)
      .not("make_model", "is", null);

    const lengthPattern = /^\d+(\.\d+)?\s*ft$/i;
    const ghostIds = (candidates ?? [])
      .filter((v) => lengthPattern.test(v.make_model ?? ""))
      .map((v) => v.id);

    if (ghostIds.length > 0) {
      await supabase.from("vessels").delete().in("id", ghostIds);
    }

    revalidatePath("/pro/contacts");
    return { deleted: (pass1?.length ?? 0) + ghostIds.length };
  } catch (err) {
    return { deleted: 0, error: err instanceof Error ? err.message : "Purge failed." };
  }
}

export async function mergeContacts(keepId: string, dropId: string): Promise<{ error?: string }> {
  const supabase = await createServerSupabase();

  // Re-point all related rows to the keeper
  await supabase.from("timeline_events").update({ contact_id: keepId }).eq("contact_id", dropId);
  await supabase.from("vessels").update({ owner_id: keepId }).eq("owner_id", dropId);
  await supabase.from("linked_contacts").update({ primary_contact_id: keepId }).eq("primary_contact_id", dropId);

  // Fill in any missing fields on the keeper from the dropped contact
  const { data: drop } = await supabase
    .from("contacts")
    .select("name, email, phone, company_name, vessel_type, vessel_length, source, notes")
    .eq("id", dropId)
    .maybeSingle();

  if (drop) {
    const { data: keep } = await supabase
      .from("contacts")
      .select("name, email, phone, company_name, vessel_type, vessel_length")
      .eq("id", keepId)
      .maybeSingle();

    const patch: Record<string, unknown> = {};
    if (!keep?.name && drop.name) patch.name = drop.name;
    if (!keep?.email && drop.email) patch.email = drop.email;
    if (!keep?.phone && drop.phone) patch.phone = drop.phone;
    if (!keep?.company_name && drop.company_name) patch.company_name = drop.company_name;
    if (!keep?.vessel_type && drop.vessel_type) patch.vessel_type = drop.vessel_type;
    if (!keep?.vessel_length && drop.vessel_length) patch.vessel_length = drop.vessel_length;

    if (Object.keys(patch).length > 0) {
      await supabase.from("contacts").update(patch).eq("id", keepId);
    }
  }

  const { error } = await supabase.from("contacts").delete().eq("id", dropId);
  if (error) return { error: error.message };

  revalidatePath("/pro/contacts");
  revalidatePath(`/pro/contacts/${keepId}`);
  return {};
}

export async function syncQuoForContact(
  contactId: string
): Promise<{ ok: boolean; imported: number; skipped: number; error?: string }> {
  const supabase = await svc();

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("id, name, email, phone, company_name, openphone_contact_id")
    .eq("id", contactId)
    .single();
  if (error || !contact) return { ok: false, imported: 0, skipped: 0, error: "Contact not found." };
  if (!contact.phone) return { ok: false, imported: 0, skipped: 0, error: "Contact has no phone number on file." };

  try {
    const { createOpenPhoneContact, updateOpenPhoneContact, splitName, fetchCallsByPhone, fetchMessagesByPhone } = await import("@/lib/openphone");
    const { firstName, lastName } = splitName(contact.name?.trim() ?? "");
    const opPayload = {
      firstName,
      lastName: lastName || undefined,
      company: contact.company_name?.trim() || undefined,
      phoneNumbers: [{ name: "main", value: contact.phone }],
      emails: contact.email?.trim() ? [{ name: "main", value: contact.email.trim() }] : [],
    };

    if (contact.openphone_contact_id) {
      await updateOpenPhoneContact(contact.openphone_contact_id, opPayload).catch(() => null);
    } else {
      const newId = await createOpenPhoneContact(opPayload).catch(() => null);
      if (newId) {
        await supabase.from("contacts").update({ openphone_contact_id: newId }).eq("id", contactId);
      }
    }

    const { data: existing } = await supabase
      .from("timeline_events")
      .select("metadata")
      .eq("contact_id", contactId)
      .in("event_type", ["call", "sms"]);

    type Meta = Record<string, string> | null;
    const existingCallIds = new Set(
      (existing ?? []).map((e) => (e.metadata as Meta)?.quo_call_id).filter(Boolean)
    );
    const existingMsgIds = new Set(
      (existing ?? []).map((e) => (e.metadata as Meta)?.quo_message_id).filter(Boolean)
    );

    const [calls, messages] = await Promise.all([
      fetchCallsByPhone(contact.phone),
      fetchMessagesByPhone(contact.phone),
    ]);

    let imported = 0;
    let skipped = 0;
    const inserts: Record<string, unknown>[] = [];

    for (const call of calls) {
      if (existingCallIds.has(call.id)) { skipped++; continue; }

      const rawDir = call.direction ?? "incoming";
      const isInbound = rawDir === "inbound" || rawDir === "incoming";
      const direction = isInbound ? "inbound" : "outbound";
      const answered = !!call.answeredAt;

      let duration: number | null = null;
      if (call.answeredAt && call.completedAt) {
        const ms = new Date(call.completedAt).getTime() - new Date(call.answeredAt).getTime();
        duration = Math.floor(ms / 1000);
      }

      const callerPhone = isInbound
        ? (Array.isArray(call.from) ? call.from[0] : call.from)
        : (Array.isArray(call.to) ? call.to[0] : call.to);

      if (answered) {
        inserts.push({
          contact_id: contactId,
          event_type: "call",
          title: direction === "outbound" ? "Outbound Call" : "Inbound Call",
          body: duration != null
            ? `Duration: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`
            : "Call completed.",
          metadata: { direction, duration, caller_number: callerPhone, recording_url: call.recordingUrl ?? null, quo_call_id: call.id },
          created_by: "system",
          created_at: call.createdAt,
        });
      } else {
        inserts.push({
          contact_id: contactId,
          event_type: "call",
          title: direction === "outbound" ? "Voicemail Left" : "Missed Call",
          body: direction === "outbound" ? "Outbound call — went to voicemail." : "Missed call. No voicemail.",
          metadata: { direction, caller_number: callerPhone, quo_call_id: call.id },
          created_by: "system",
          created_at: call.createdAt,
        });
      }
      imported++;
    }

    for (const msg of messages) {
      if (existingMsgIds.has(msg.id)) { skipped++; continue; }

      const rawDir = msg.direction ?? "incoming";
      const isInbound = rawDir === "incoming" || rawDir === "inbound";
      const msgPhone = isInbound
        ? (Array.isArray(msg.from) ? msg.from[0] : msg.from)
        : (Array.isArray(msg.to) ? msg.to[0] : msg.to);

      inserts.push({
        contact_id: contactId,
        event_type: "sms",
        title: isInbound ? "Inbound SMS" : "Outbound SMS",
        body: msg.body,
        metadata: isInbound
          ? { direction: "inbound", from_number: msgPhone, quo_message_id: msg.id }
          : { direction: "outbound", to_number: msgPhone, quo_message_id: msg.id },
        created_by: "system",
        created_at: msg.createdAt,
      });
      imported++;
    }

    if (inserts.length > 0) {
      const { error: insertErr } = await supabase.from("timeline_events").insert(inserts);
      if (insertErr) return { ok: false, imported: 0, skipped, error: insertErr.message };
    }

    revalidatePath(`/pro/contacts/${contactId}`);
    return { ok: true, imported, skipped };
  } catch (err) {
    return { ok: false, imported: 0, skipped: 0, error: err instanceof Error ? err.message : "Sync failed." };
  }
}

// ── Service Templates ──────────────────────────────────────────────────────────

export type ServiceTemplate = {
  id: string;
  name: string;
  service_label: string;
  default_amount: number;
  is_per_foot: boolean;
  description: string | null;
  created_at: string;
};

export type ServiceTemplateState = { error?: string; success?: boolean };

export async function getServiceTemplates(): Promise<ServiceTemplate[]> {
  const supabase = await svc();
  const { data } = await supabase
    .from("service_templates")
    .select("*")
    .order("name");
  return (data ?? []) as ServiceTemplate[];
}

export async function createServiceTemplate(
  _prev: ServiceTemplateState,
  formData: FormData
): Promise<ServiceTemplateState> {
  const name           = (formData.get("name") as string)?.trim();
  const service_label  = (formData.get("service_label") as string)?.trim() || name;
  const default_amount = parseFloat((formData.get("default_amount") as string) ?? "0");
  const is_per_foot    = formData.get("is_per_foot") === "true";
  const description    = (formData.get("description") as string)?.trim() || null;

  if (!name) return { error: "Service name is required." };

  const supabase = await svc();
  const { error } = await supabase
    .from("service_templates")
    .insert({ name, service_label, default_amount, is_per_foot, description });
  if (error) return { error: error.message };

  revalidatePath("/pro/services");
  return { success: true };
}

export async function updateServiceTemplate(
  _prev: ServiceTemplateState,
  formData: FormData
): Promise<ServiceTemplateState> {
  const id             = formData.get("id") as string;
  const name           = (formData.get("name") as string)?.trim();
  const service_label  = (formData.get("service_label") as string)?.trim() || name;
  const default_amount = parseFloat((formData.get("default_amount") as string) ?? "0");
  const is_per_foot    = formData.get("is_per_foot") === "true";
  const description    = (formData.get("description") as string)?.trim() || null;

  if (!id || !name) return { error: "Missing required fields." };

  const supabase = await svc();
  const { error } = await supabase
    .from("service_templates")
    .update({ name, service_label, default_amount, is_per_foot, description })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/pro/services");
  return { success: true };
}

export async function deleteServiceTemplate(id: string): Promise<{ error?: string }> {
  const supabase = await svc();
  const { error } = await supabase
    .from("service_templates")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/pro/services");
  return {};
}
