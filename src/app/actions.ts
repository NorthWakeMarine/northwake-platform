"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { ingestContact } from "@/lib/ingest";
import { sendLeadNotification } from "@/lib/gmail";
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

// ─── Web Services Inquiry ─────────────────────────────────────────────────────

const webServicesSchema = z.object({
  name:            z.string().min(1, "Please enter your name."),
  company:         z.string().min(1, "Please enter your business name."),
  email:           z.string().email("Please enter a valid email address."),
  phone:           z.string().optional(),
  industry:        z.string().min(1, "Please select your industry."),
  tier:            z.string().min(1, "Please select a tier."),
  current_website: z.string().optional(),
  message:         z.string().optional(),
});

export type WebServicesFormState = { success: boolean; error?: string };

export async function submitWebServicesInquiry(
  _prev: WebServicesFormState,
  formData: FormData
): Promise<WebServicesFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = webServicesSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const d = parsed.data;
  const notes = [
    d.company && `Company: ${d.company}`,
    d.current_website && `Current site: ${d.current_website}`,
    d.message && d.message,
  ].filter(Boolean).join("\n");

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("leads").insert({
    name:            d.name,
    email:           d.email,
    phone:           normalizePhone(d.phone),
    vessel_type:     d.industry,
    service:         d.tier,
    source:          "web_services",
    message:         notes || null,
    referral_source: null,
  });

  if (error) return { success: false, error: error.message };

  sendLeadNotification({
    name:       d.name,
    email:      d.email,
    phone:      d.phone ?? null,
    service:    d.tier,
    vesselType: d.industry,
    message:    notes || null,
  }).catch((err) => console.error("Web services inquiry email error:", err));

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
  const redirectTo = (formData.get("redirectTo") as string | null) || "/pro/dashboard";
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/pro/dashboard";

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
    const { data: byPhone } = await supabase
      .from("contacts")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    if (byPhone) id = byPhone.id;
  }

  if (id) {
    await supabase
      .from("contacts")
      .update({ waiver_signed: true, name, phone })
      .eq("id", id);
  } else {
    const { data: newContact, error: createErr } = await supabase
      .from("contacts")
      .insert({ name, email, phone, source: "waiver", status: "lead", waiver_signed: true })
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

    const waiverText = [
      clientConfig.waiverTitle,
      "=====================================",
      "",
      `Full Name:    ${name}`,
      `Date Signed:  ${date}`,
      `Email:        ${email}`,
      `Phone:        ${phone}`,
      `Address:      ${address}`,
      `Vessel/Boat:  ${boat}`,
      "",
      "ELECTRONIC SIGNATURE",
      "---------------------",
      signature,
      "",
      `The signer acknowledged and agreed to the ${clientConfig.companyName} Liability`,
      "Waiver and Release of Claims on the date above.",
    ].join("\n");

    const fileName = `Waiver - ${name} - ${date}.txt`;
    await uploadFileToFolder(folderId, fileName, "text/plain", Buffer.from(waiverText, "utf-8"));
  } catch (err) {
    console.error("Waiver Drive upload failed (non-fatal):", err);
  }

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

  let contact = null;

  if (lead.email) {
    const { data } = await supabase
      .from("contacts")
      .select("id, name, email, phone")
      .eq("email", lead.email)
      .maybeSingle();
    contact = data;
  }

  if (!contact && lead.phone) {
    const { data } = await supabase
      .from("contacts")
      .select("id, name, email, phone")
      .eq("phone", normalizePhone(lead.phone) ?? lead.phone)
      .maybeSingle();
    contact = data;
  }

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

  let contactId: string | null = null;

  if (!force_create) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", lead.email)
      .maybeSingle();
    if (existing) contactId = existing.id;
  }

  if (contactId) {
    await supabase
      .from("contacts")
      .update({ name: lead.name, phone: normalizePhone(lead.phone), vessel_type: lead.vessel_type, vessel_length: lead.vessel_length, waiver_signed: lead.waiver_signed ?? false, status: "client" })
      .eq("id", contactId);
  } else {
    const { data: newContact, error: contactErr } = await supabase
      .from("contacts")
      .insert({ name: lead.name, email: lead.email, phone: normalizePhone(lead.phone), vessel_type: lead.vessel_type, vessel_length: lead.vessel_length, waiver_signed: lead.waiver_signed ?? false, source: lead.source ?? "website", status: "client" })
      .select("id")
      .single();
    if (contactErr || !newContact) return { error: contactErr?.message ?? "Failed to create contact." };
    contactId = newContact.id;
  }

  if (contactId) await insertVessel(supabase, contactId, lead);

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

  // Patch any new info onto the existing contact
  await supabase
    .from("contacts")
    .update({
      ...(lead.name  ? { name: lead.name }   : {}),
      ...(lead.phone ? { phone: normalizePhone(lead.phone) ?? lead.phone } : {}),
      ...(lead.vessel_type   ? { vessel_type: lead.vessel_type }     : {}),
      ...(lead.vessel_length ? { vessel_length: lead.vessel_length } : {}),
      ...(lead.waiver_signed ? { waiver_signed: true }               : {}),
      status: "client",
    })
    .eq("id", contact_id);

  await insertVessel(supabase, contact_id, lead);

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
  const length_ft   = (formData.get("length_ft")   as string)?.trim() || null;
  const location    = (formData.get("location")    as string)?.trim() || null;
  const registration = (formData.get("registration") as string)?.trim() || null;
  const notes       = (formData.get("notes")       as string)?.trim() || null;
  const intervalRaw = formData.get("service_interval_days") as string;
  const service_interval_days = intervalRaw ? parseInt(intervalRaw, 10) : 90;

  if (!contact_id) return { error: "Missing contact." };

  const supabase = await svc();

  const { data: contactRow } = await supabase
    .from("contacts")
    .select("name")
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

  const assetLabel = name || make_model || asset_type;
  try {
    const { createAssetFolder } = await import("@/lib/google-drive");
    const driveUrl = await createAssetFolder(contactName, assetLabel);
    await supabase.from("vessels").update({ drive_folder_url: driveUrl }).eq("id", inserted.id);
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
    length_ft:  (formData.get("length_ft")  as string)?.trim() || null,
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

export async function updateContactFields(
  contactId: string,
  fields: { name?: string | null; email?: string | null; phone?: string | null; address?: string | null; waiver_signed?: boolean; contact_type?: string | null; company_name?: string | null; notes?: string | null }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await svc();
  const patch: Record<string, string | boolean | null> = {};
  if ("name"          in fields) patch.name          = fields.name?.trim()         || null;
  if ("company_name"  in fields) patch.company_name  = fields.company_name?.trim() || null;
  if ("email"         in fields) patch.email         = fields.email?.trim()        || null;
  if ("phone"         in fields) patch.phone         = fields.phone?.trim()        || null;
  if ("address"       in fields) patch.address       = fields.address?.trim()      || null;
  if ("notes"         in fields) patch.notes         = fields.notes?.trim()        || null;
  if ("waiver_signed" in fields) patch.waiver_signed = fields.waiver_signed ?? false;
  if ("contact_type"  in fields) patch.contact_type  = fields.contact_type        || null;
  const { error } = await supabase.from("contacts").update(patch).eq("id", contactId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/pro/contacts/${contactId}`);
  return { ok: true };
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

  const supabase = await svc();
  const { error } = await supabase.from("vessel_services").insert({
    vessel_id,
    service_name,
    interval_days: isNaN(interval_days) ? 90 : interval_days,
    last_service_date: last_service_date || null,
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
    revalidatePath("/pro/dashboard");
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
    });
    revalidatePath("/pro/calendar");
    revalidatePath("/pro/dashboard");
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
    });
    revalidatePath("/pro/calendar");
    revalidatePath("/pro/dashboard");
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
    revalidatePath("/pro/dashboard");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete event." };
  }
}

// ─── Delete Contact ───────────────────────────────────────────────────────────

export async function deleteContact(contactId: string): Promise<{ error?: string }> {
  const supabase = await svc();
  // Cascade: vessels, linked_contacts, and timeline_events should be set up
  // with ON DELETE CASCADE in Supabase, but delete children explicitly to be safe
  await supabase.from("vessels").delete().eq("owner_id", contactId);
  await supabase.from("linked_contacts").delete().eq("primary_contact_id", contactId);
  await supabase.from("timeline_events").delete().eq("contact_id", contactId);
  const { error } = await supabase.from("contacts").delete().eq("id", contactId);
  if (error) return { error: error.message };
  revalidatePath("/pro/contacts");
  return {};
}

// ─── Delete Lead ─────────────────────────────────────────────────────────────

export async function deleteLead(leadId: string): Promise<{ error?: string }> {
  const supabase = await svc();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/pro/leads");
  revalidatePath("/pro/dashboard");
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

    revalidatePath("/pro/dashboard");
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

  const updatePayload: Record<string, unknown> = { pipeline_stage: newStage };
  if (contact.pipeline_stage === "needs_attention") {
    updatePayload.health_flags = [];
  }
  await supabase.from("contacts").update(updatePayload).eq("id", id);

  const { data: vessel } = await supabase
    .from("vessels")
    .select("name")
    .eq("owner_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  revalidatePath("/pro/dashboard");
  return { ok: true, contactId: id, contactName: contact.name ?? "Unknown", vesselName: vessel?.name ?? null };
}

export async function removeFromPipeline(contactId: string): Promise<{ ok: boolean }> {
  const supabase = await svc();
  await supabase.from("contacts").update({ pipeline_stage: null }).eq("id", contactId);
  revalidatePath("/pro/dashboard");
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

    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, name, company_name, email, phone")
      .eq("contact_type", "customer")
      .not("name", "is", null);

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
    const { getQbTokens, getQbCustomer, buildNotesWithVessels, updateQbCustomerNotes } = await import("@/lib/quickbooks");
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
          lengthFt: v.length_ft as string | null,
        }));
        const customer = await getQbCustomer(c.qb_customer_id!);
        const newNotes = buildNotesWithVessels(customer.Notes ?? null, noteVessels);
        if (newNotes.trim() !== (customer.Notes ?? "").trim()) {
          await updateQbCustomerNotes(c.qb_customer_id!, customer.SyncToken!, newNotes);
          return 1;
        }
      } catch { /* skip */ }
      return 0;
    }, 5);
    synced = results.reduce((a: number, b: number) => a + b, 0);

    return { synced };
  } catch (err) {
    return { synced: 0, error: err instanceof Error ? err.message : "QB notes sync failed." };
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

export async function syncDialpadCallsForContact(
  contactId: string
): Promise<{ ok: boolean; synced: number; error?: string }> {
  const supabase = await svc();

  // Get the contact's phone
  const { data: contact, error: contactErr } = await supabase
    .from("contacts")
    .select("phone")
    .eq("id", contactId)
    .single();
  if (contactErr || !contact?.phone) {
    return { ok: false, synced: 0, error: "Contact not found or has no phone number." };
  }

  const contactPhone = normalizePhone(contact.phone);
  if (!contactPhone) return { ok: false, synced: 0, error: "Could not normalize contact phone." };

  // Fetch up to 90 days of calls from Dialpad
  const { listDialpadCalls } = await import("@/lib/dialpad");
  let calls;
  try {
    calls = await listDialpadCalls({
      maxTotal: 500,
      started_after: Date.now() - 90 * 24 * 60 * 60 * 1000,
    });
  } catch (e) {
    return { ok: false, synced: 0, error: e instanceof Error ? e.message : "Dialpad API error." };
  }

  // Filter to calls involving this contact's phone
  const matched = calls.filter((c) => {
    const ext = normalizePhone(c.external_number ?? "");
    return ext === contactPhone;
  });
  if (matched.length === 0) return { ok: true, synced: 0 };

  // Get existing dialpad_call_ids already in the timeline for this contact
  const { data: existing } = await supabase
    .from("timeline_events")
    .select("metadata")
    .eq("contact_id", contactId)
    .eq("event_type", "call");

  const knownIds = new Set(
    (existing ?? [])
      .map((e) => (e.metadata as Record<string, unknown>)?.dialpad_call_id as string | undefined)
      .filter(Boolean)
  );

  // Insert only calls not already in the timeline
  const toInsert = matched.filter((c) => !knownIds.has(c.id));
  if (toInsert.length === 0) return { ok: true, synced: 0 };

  const rows = toInsert.map((c) => {
    const dir = c.direction ?? "inbound";
    const dur = c.duration ?? null;
    const durText = dur ? `Duration: ${Math.floor(dur / 60)}m ${dur % 60}s` : null;
    return {
      contact_id: contactId,
      event_type: "call",
      title: dir === "outbound" ? "Outbound Call" : "Inbound Call",
      body: durText,
      created_at: new Date(c.date_started).toISOString(),
      metadata: {
        direction: dir,
        duration: dur,
        recording_url: c.recording_url ?? null,
        dialpad_call_id: c.id,
        source: "dialpad_sync",
      },
      created_by: "system",
    };
  });

  const { error: insertErr } = await supabase.from("timeline_events").insert(rows);
  if (insertErr) return { ok: false, synced: 0, error: insertErr.message };

  revalidatePath(`/pro/contacts/${contactId}`);
  return { ok: true, synced: toInsert.length };
}

// ─── Integrity Engine ─────────────────────────────────────────────────────────

type IntegrityFlag = { type: string; label: string };

export async function runIntegrityCheck(): Promise<{ checked: number; flagged: number; error?: string }> {
  const supabase = await svc();

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("id, pipeline_stage, qb_customer_id, waiver_signed, vessels ( id )")
    .eq("contact_type", "customer")
    .not("pipeline_stage", "eq", "done_invoiced");

  if (error) return { checked: 0, flagged: 0, error: error.message };
  if (!contacts?.length) return { checked: 0, flagged: 0 };

  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

  let flagged = 0;

  for (const contact of contacts) {
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

    // Check for unreturned inbound communication in the last 4 hours
    const { data: recentEvents } = await supabase
      .from("timeline_events")
      .select("id, metadata")
      .eq("contact_id", contact.id)
      .in("event_type", ["call", "sms"])
      .gte("created_at", fourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentEvents && recentEvents.length > 0) {
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

    if (hadFlags) flagged++;
  }

  revalidatePath("/pro/dashboard");
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
    const { listQbCustomers, getQbTokens, parseVesselsFromNotes } = await import("@/lib/quickbooks");
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

        // Sync vessels from QB Notes → CRM
        const noteVessels = parseVesselsFromNotes(qbC.Notes ?? null);
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
                year: nv.year, make_model: nv.makeModel, length_ft: nv.lengthFt,
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
    revalidatePath("/pro/dashboard");
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

    // Deduplicate by qb_txn_id (new format) or qb_invoice_id (legacy format)
    const { data: existing } = await supabase
      .from("timeline_events")
      .select("metadata")
      .in("event_type", ["invoice", "payment", "sales_receipt", "credit_memo"]);

    const importedIds = new Set<string>();
    for (const e of existing ?? []) {
      const meta = e.metadata as { qb_txn_id?: string; qb_invoice_id?: string };
      if (meta?.qb_txn_id) importedIds.add(meta.qb_txn_id);
      // Normalize legacy invoice IDs so we don't reimport them under the new key
      if (meta?.qb_invoice_id) importedIds.add(`Invoice:${meta.qb_invoice_id}`);
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
        if (importedIds.has(key)) { skipped++; continue; }
        importedIds.add(key);

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
    contact_type: "customer",
    pipeline_stage: "new_leads",
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
  revalidatePath("/pro/dashboard");
  return { ok: true };
}

// ─── Dialpad Contact Import ───────────────────────────────────────────────────

export type DpUnmatched = {
  dpId: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export async function importDialpadContacts(): Promise<{
  fetched: number;
  linked: number;
  alreadyLinked: number;
  unmatched: DpUnmatched[];
  mismatches: FieldMismatch[];
  error?: string;
}> {
  const supabase = await svc();
  try {
    const { listDialpadContacts, dialpadContactPhones } = await import("@/lib/dialpad");
    const dpContacts = await listDialpadContacts();

    const { data: crmContacts } = await supabase
      .from("contacts")
      .select("id, name, email, phone, dialpad_contact_id");

    const contacts = crmContacts ?? [];
    const emailMap = new Map(contacts.filter(c => c.email).map(c => [c.email!.toLowerCase(), c]));
    const phoneMap = new Map(
      contacts.filter(c => c.phone).map(c => [normalizePhone(c.phone!), c])
    );
    const nameMap  = new Map(contacts.filter(c => c.name).map(c => [c.name!.toLowerCase().trim(), c]));

    let linked = 0;
    let alreadyLinked = 0;
    const unmatched: DpUnmatched[] = [];
    const mismatches: FieldMismatch[] = [];

    for (const dp of dpContacts) {
      const dpEmail = dp.emails?.[0]?.toLowerCase() ?? null;
      const dpPhone = dialpadContactPhones(dp)[0] ? normalizePhone(dialpadContactPhones(dp)[0]) : null;
      const dpName = dp.display_name?.toLowerCase().trim() ?? "";

      // Exact match first, then prefix match for old "Name Vessel" combined format
      const prefixMatch = dpName
        ? contacts.find((c) => {
            const n = c.name?.toLowerCase().trim() ?? "";
            return n.length > 3 && dpName.startsWith(n + " ");
          })
        : undefined;

      const match =
        (dpEmail ? emailMap.get(dpEmail) : undefined) ??
        (dpPhone ? phoneMap.get(dpPhone) : undefined) ??
        (dpName ? nameMap.get(dpName) : undefined) ??
        prefixMatch;

      if (match) {
        if (match.dialpad_contact_id === dp.id) {
          alreadyLinked++;
        } else {
          await supabase.from("contacts").update({ dialpad_contact_id: dp.id }).eq("id", match.id);
          linked++;
        }
        if (dpEmail && dpEmail !== (match.email?.toLowerCase() ?? "")) {
          mismatches.push({ contactId: match.id, contactName: match.name, field: "email", crmValue: match.email, sourceValue: dp.emails![0] });
        }
        if (dpPhone && normalizePhone(match.phone ?? "") !== dpPhone) {
          mismatches.push({ contactId: match.id, contactName: match.name, field: "phone", crmValue: match.phone, sourceValue: dpPhone });
        }
      } else {
        unmatched.push({
          dpId:  dp.id,
          name:  dp.display_name ?? "Unknown",
          email: dp.emails?.[0] ?? null,
          phone: dpPhone,
        });
      }
    }

    return { fetched: dpContacts.length, linked, alreadyLinked, unmatched, mismatches };
  } catch (err) {
    return { fetched: 0, linked: 0, alreadyLinked: 0, unmatched: [], mismatches: [], error: err instanceof Error ? err.message : "Dialpad import failed." };
  }
}

export async function createContactFromDialpad(
  dpId: string,
  name: string,
  email: string | null,
  phone: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await svc();
  try {
    const { error } = await supabase.from("contacts").insert({
      name,
      email: email || null,
      phone: phone || null,
      dialpad_contact_id: dpId,
      source: "dialpad",
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create contact." };
  }
}

// ─── Dialpad Contact Sync ─────────────────────────────────────────────────────

export async function syncDialpadContacts(): Promise<{ synced: number; mismatches: FieldMismatch[]; error?: string }> {
  const supabase = await svc();
  try {
    const { listDialpadContacts, dialpadContactPhones } = await import("@/lib/dialpad");
    const dpContacts = await listDialpadContacts();

    let synced = 0;
    const mismatches: FieldMismatch[] = [];

    for (const dp of dpContacts) {
      const phones = dialpadContactPhones(dp);
      for (const phone of phones) {
        const normalized = phone.startsWith("+") ? phone : `+1${phone.replace(/\D/g, "")}`;
        const { data: match } = await supabase
          .from("contacts")
          .select("id, name, email, phone")
          .eq("phone", normalized)
          .maybeSingle();
        if (match) {
          await supabase
            .from("contacts")
            .update({ dialpad_contact_id: dp.id })
            .eq("id", match.id);
          synced++;

          // Compare all fields Dialpad has against CRM
          const dpEmail = dp.emails?.[0];
          if (dpEmail && dpEmail.toLowerCase() !== (match.email?.toLowerCase() ?? "")) {
            mismatches.push({ contactId: match.id, contactName: match.name, field: "email", crmValue: match.email, sourceValue: dpEmail });
          }
          const dpName = dp.display_name;
          if (dpName && dpName.toLowerCase() !== (match.name?.toLowerCase() ?? "")) {
            mismatches.push({ contactId: match.id, contactName: match.name, field: "name", crmValue: match.name, sourceValue: dpName });
          }
          break;
        }
      }
    }
    return { synced, mismatches };
  } catch (err) {
    return { synced: 0, mismatches: [], error: err instanceof Error ? err.message : "Dialpad sync failed." };
  }
}

export async function registerDialpadWebhook(): Promise<{ ok: boolean; id?: string; existing?: boolean; error?: string }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return { ok: false, error: "NEXT_PUBLIC_SITE_URL not set." };

  const hookUrl = `${siteUrl}/api/webhooks/dialpad`;
  const secret = process.env.DIALPAD_WEBHOOK_SECRET ?? "";

  try {
    const { listDialpadWebhooks, registerDialpadEventSubscription } = await import("@/lib/dialpad");

    const existing = await listDialpadWebhooks();
    const alreadyRegistered = existing.items?.find((s) => s.hook_url === hookUrl);
    if (alreadyRegistered) return { ok: true, id: String(alreadyRegistered.id), existing: true };

    const result = await registerDialpadEventSubscription(hookUrl, secret);
    if (result.error) return { ok: false, error: result.error };
    return { ok: true, id: String(result.webhookId) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function pushCrmToDialpad(): Promise<{ updated: number; created: number; error?: string }> {
  const supabase = await svc();
  try {
    const { updateDialpadContact, createDialpadContact } = await import("@/lib/dialpad");

    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, name, company_name, email, phone, dialpad_contact_id")
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

    const counts = await pMap(contacts ?? [], async (c) => {
      const payload = {
        first_name: c.name ?? c.company_name ?? "",
        last_name: vesselMap.get(c.id) ?? "",
        ...(c.company_name ? { company: c.company_name } : {}),
        ...(c.email ? { emails: [c.email] } : {}),
        ...(c.phone ? { phone_numbers: [c.phone] } : {}),
      };
      if (c.dialpad_contact_id) {
        await updateDialpadContact(c.dialpad_contact_id, payload);
        return { updated: 1, created: 0 };
      } else {
        const newId = await createDialpadContact(payload);
        if (newId) {
          await supabase.from("contacts").update({ dialpad_contact_id: newId }).eq("id", c.id);
          return { updated: 0, created: 1 };
        }
      }
      return { updated: 0, created: 0 };
    }, 10);

    const updated = counts.reduce((a, b) => a + b.updated, 0);
    const created = counts.reduce((a, b) => a + b.created, 0);
    return { updated, created };
  } catch (err) {
    return { updated: 0, created: 0, error: err instanceof Error ? err.message : "Push failed." };
  }
}

export async function promoteDialpadLocalToCompany(): Promise<{
  promoted: number;
  alreadyShared: number;
  error?: string;
}> {
  try {
    const { listDialpadContactsByType, createDialpadContact, dialpadContactPhones } = await import("@/lib/dialpad");
    const [localContacts, companyContacts] = await Promise.all([
      listDialpadContactsByType("local", 500),
      listDialpadContactsByType("company", 500),
    ]);

    // Build dedup sets from existing company contacts
    const sharedPhones = new Set(
      companyContacts.flatMap((c) => dialpadContactPhones(c).map((p) => normalizePhone(p) ?? p))
    );
    const sharedEmails = new Set(
      companyContacts.flatMap((c) => (c.emails ?? []).map((e: string) => e.toLowerCase()))
    );

    let promoted = 0;
    let alreadyShared = 0;

    for (const c of localContacts) {
      const phones: string[] = dialpadContactPhones(c);
      const emails: string[] = c.emails ?? [];
      const alreadyInCompany =
        phones.some((p: string) => sharedPhones.has(normalizePhone(p) ?? p)) ||
        emails.some((e: string) => sharedEmails.has(e.toLowerCase()));

      if (alreadyInCompany) {
        alreadyShared++;
        continue;
      }

      const newId = await createDialpadContact({
        first_name: c.display_name,
        ...(emails.length ? { emails } : {}),
        ...(phones.length ? { phone_numbers: phones } : {}),
      });
      if (newId) {
        phones.forEach((p: string) => sharedPhones.add(normalizePhone(p) ?? p));
        emails.forEach((e: string) => sharedEmails.add(e.toLowerCase()));
        promoted++;
      }
    }

    return { promoted, alreadyShared };
  } catch (err) {
    return { promoted: 0, alreadyShared: 0, error: err instanceof Error ? err.message : "Promotion failed." };
  }
}

// ─── OpenPhone Sync ──────────────────────────────────────────────────────────

export type OpUnmatched = { opId: string; name: string; phone: string | null; email: string | null };

export async function importOpenPhoneContacts(): Promise<{
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
          opId:  op.id,
          name:  [op.firstName, op.lastName].filter(Boolean).join(" ") || "Unknown",
          phone: opPhone,
          email: op.emails?.[0]?.value ?? null,
        });
      }
    }

    return { fetched: opContacts.length, linked, alreadyLinked, unmatched };
  } catch (err) {
    return { fetched: 0, linked: 0, alreadyLinked: 0, unmatched: [], error: err instanceof Error ? err.message : "OpenPhone import failed." };
  }
}

export async function createContactFromOpenPhone(opId: string, name: string, phone: string | null, email: string | null): Promise<{ ok: boolean; error?: string }> {
  const supabase = await svc();
  try {
    const normalized = normalizePhone(phone ?? "") ?? phone ?? null;
    const { data, error } = await supabase.from("contacts").insert({
      name,
      phone: normalized,
      email: email ?? null,
      source: "openphone",
      contact_type: "customer",
      status: "lead",
      openphone_contact_id: opId,
    }).select("id").single();
    if (error) return { ok: false, error: error.message };
    await supabase.from("timeline_events").insert({
      contact_id: data.id,
      event_type: "lead_created",
      title: "Lead created from OpenPhone contact import",
      body: null,
      created_by: "system",
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function pushCrmToOpenPhone(): Promise<{ updated: number; created: number; error?: string }> {
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

    // Build a phone index of existing OpenPhone contacts to avoid duplicates on create
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
    }, 10);

    const updated = counts.reduce((a, b) => a + b.updated, 0);
    const created = counts.reduce((a, b) => a + b.created, 0);
    return { updated, created };
  } catch (err) {
    return { updated: 0, created: 0, error: err instanceof Error ? err.message : "OpenPhone push failed." };
  }
}

export async function purgeGhostVessels(): Promise<{ deleted: number; error?: string }> {
  const supabase = await svc();
  try {
    // Ghost vessels: no name, no make_model, no year — only length or entirely blank
    const { data, error } = await supabase
      .from("vessels")
      .delete()
      .is("name", null)
      .is("make_model", null)
      .is("year", null)
      .select("id");
    if (error) return { deleted: 0, error: error.message };
    revalidatePath("/pro/contacts");
    return { deleted: data?.length ?? 0 };
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
