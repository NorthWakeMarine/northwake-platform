"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { ingestContact } from "@/lib/ingest";
import { parsePhoneNumberFromString } from "libphonenumber-js";

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const parsed = parsePhoneNumberFromString(raw, "US");
  return parsed?.isValid() ? parsed.format("E.164") : raw.trim() || null;
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
  const { error } = await supabase.from("timeline_events").insert({
    contact_id,
    event_type: "note",
    title: "Note added",
    body,
    created_by: "pro",
  });

  if (error) return { error: error.message };

  revalidatePath(`/pro/contacts/${contact_id}`);
  return { success: true };
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
  const asset_id   = formData.get("asset_id")   as string;
  const contact_id = formData.get("contact_id") as string;
  const notes      = (formData.get("notes") as string)?.trim() || null;

  if (!asset_id) return { error: "Missing asset ID." };

  const supabase = await svc();
  const { error } = await supabase.from("vessels").update({ notes }).eq("id", asset_id);
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

// ─── Conflict Detection ───────────────────────────────────────────────────────

export async function detectServiceConflicts(): Promise<{ flagged: number; error?: string }> {
  // Placeholder invoice date — will be replaced once QuickBooks is connected
  const PLACEHOLDER_LAST_INVOICE = "2025-01-01";

  const supabase = await createServerSupabase();

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, name, last_service_date")
    .not("last_service_date", "is", null);

  if (error) return { flagged: 0, error: error.message };
  if (!leads?.length) return { flagged: 0 };

  let flagged = 0;

  for (const lead of leads) {
    if (lead.last_service_date !== PLACEHOLDER_LAST_INVOICE) {
      const { data: existing } = await supabase
        .from("system_flags")
        .select("id")
        .eq("reference_id", lead.id)
        .eq("flag_type", "service_invoice_mismatch")
        .eq("resolved", false)
        .maybeSingle();

      if (!existing) {
        await supabase.from("system_flags").insert({
          flag_type:      "service_invoice_mismatch",
          reference_id:   lead.id,
          reference_type: "lead",
          message: `Service date ${lead.last_service_date} does not match last invoice date ${PLACEHOLDER_LAST_INVOICE}`,
        });
        flagged++;
      }
    }
  }

  return { flagged };
}
