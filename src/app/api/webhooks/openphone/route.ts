import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import crypto from "crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

function svc(): AnySupabase {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const parsed = parsePhoneNumberFromString(raw, "US");
  return parsed?.isValid() ? parsed.format("E.164") : raw.trim() || null;
}

function verifySignature(rawBody: string, header: string): boolean {
  const secret = process.env.OPENPHONE_WEBHOOK_SECRET;
  if (!secret) return true;
  try {
    // Format: t=<timestamp>,v1=<digest>
    const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
    const timestamp = parts["t"];
    const digest = parts["v1"];
    if (!timestamp || !digest) return false;
    const signed = `${timestamp}.${rawBody}`;
    const expected = crypto
      .createHmac("sha256", Buffer.from(secret, "base64"))
      .update(signed)
      .digest("base64");
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function findContactByPhone(supabase: AnySupabase, phone: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const { data } = await supabase
    .from("contacts")
    .select("id, name")
    .eq("phone", normalized)
    .maybeSingle();
  return data ?? null;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("openphone-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = payload.type as string | undefined;
  const obj = (payload.data as Record<string, unknown>)?.object as Record<string, unknown> | undefined;
  if (!type || !obj) return NextResponse.json({ ok: true });

  if (type === "call.completed") {
    await handleCompletedCall(obj);
  } else if (type === "call.missed") {
    await handleMissedCall(obj);
  } else if (type === "message.received") {
    await handleInboundSms(obj);
  } else if (type === "contact.created" || type === "contact.updated") {
    await handleContactUpsert(obj);
  }

  return NextResponse.json({ ok: true });
}

async function handleCompletedCall(obj: Record<string, unknown>) {
  const supabase = svc();
  const from = obj.from as string | undefined;
  const direction = (obj.direction as string | undefined) ?? "inbound";
  const callerPhone = direction === "inbound" ? from : (obj.to as string | undefined);
  if (!callerPhone) return;

  const normalized = normalizePhone(callerPhone);
  if (!normalized) return;

  const contact = await findContactByPhone(supabase, normalized);
  if (!contact) return;

  // Duration from answeredAt / completedAt timestamps
  let duration: number | null = null;
  if (obj.answeredAt && obj.completedAt) {
    const ms = new Date(obj.completedAt as string).getTime() - new Date(obj.answeredAt as string).getTime();
    duration = Math.floor(ms / 1000);
  }

  const label = direction === "outbound" ? "Outbound Call" : "Inbound Call";

  await supabase.from("timeline_events").insert({
    contact_id:  contact.id,
    event_type:  "call",
    title:       label,
    body:        duration != null
      ? `Duration: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`
      : "Call completed.",
    metadata:    { direction, duration, recording_url: obj.recordingUrl ?? null, openphone_call_id: obj.id },
    created_by:  "system",
  });
}

async function handleMissedCall(obj: Record<string, unknown>) {
  const supabase = svc();
  const from = obj.from as string | undefined;
  if (!from) return;

  const normalized = normalizePhone(from);
  if (!normalized) return;

  const contact = await findContactByPhone(supabase, normalized);
  const voicemail = (obj.voicemail as Record<string, unknown> | undefined)?.transcript as string | undefined;

  if (contact) {
    await supabase.from("timeline_events").insert({
      contact_id:  contact.id,
      event_type:  "call",
      title:       voicemail ? "Voicemail Received" : "Missed Call",
      body:        voicemail ?? "Missed call. No voicemail.",
      metadata:    { direction: "inbound", openphone_call_id: obj.id, caller_number: normalized },
      created_by:  "system",
    });
  } else {
    const { ingestContact } = await import("@/lib/ingest");
    await ingestContact({
      phone: normalized,
      source: "openphone",
      event_type: "call",
      event_title: voicemail ? "Voicemail Received" : "Missed Call",
      event_body: voicemail ?? "Missed call from unknown number. No voicemail.",
      metadata: { direction: "inbound", openphone_call_id: obj.id },
    });
  }
}

async function handleContactUpsert(obj: Record<string, unknown>) {
  const supabase = svc();
  try {
    // OpenPhone contact fields can be top-level or nested under defaultFields
    const fields = (obj.defaultFields as Record<string, unknown> | undefined) ?? obj;
    const firstName = (fields.firstName ?? obj.firstName) as string | undefined;
    const lastName = (fields.lastName ?? obj.lastName) as string | undefined;
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || null;
    const company = (fields.company ?? obj.company) as string | undefined;

    type PhoneEntry = { value?: string | null };
    const rawPhones = ((fields.phoneNumbers ?? obj.phoneNumbers) as PhoneEntry[] | undefined) ?? [];
    const phones = rawPhones.map((p) => normalizePhone(p.value ?? null)).filter((p): p is string => !!p);

    type EmailEntry = { value?: string | null };
    const rawEmails = ((fields.emails ?? obj.emails) as EmailEntry[] | undefined) ?? [];
    const emails = rawEmails.map((e) => e.value?.toLowerCase() ?? "").filter(Boolean);

    // Try to find existing CRM contact by phone then email
    let match: { id: string; name: string | null; phone: string | null; email: string | null; company_name: string | null } | null = null;

    for (const phone of phones) {
      const { data } = await supabase.from("contacts").select("id, name, phone, email, company_name").eq("phone", phone).maybeSingle();
      if (data) { match = data; break; }
    }
    if (!match && emails.length > 0) {
      const { data } = await supabase.from("contacts").select("id, name, phone, email, company_name").ilike("email", emails[0]).maybeSingle();
      if (data) match = data;
    }

    if (!match) return;

    const update: Record<string, unknown> = {};
    if (fullName && !match.name) update.name = fullName;
    if (phones[0] && !match.phone) update.phone = phones[0];
    if (emails[0] && !match.email) update.email = emails[0];
    if (company && !match.company_name) update.company_name = company;

    if (Object.keys(update).length > 0) {
      await supabase.from("contacts").update(update).eq("id", match.id);
    }
  } catch (err) {
    console.error("OpenPhone contact webhook error:", err);
  }
}

async function handleInboundSms(obj: Record<string, unknown>) {
  const supabase = svc();
  const from = obj.from as string | undefined;
  const body = obj.body as string | undefined;
  if (!from || !body) return;

  const normalized = normalizePhone(from);
  if (!normalized) return;

  const contact = await findContactByPhone(supabase, normalized);

  if (contact) {
    await supabase.from("timeline_events").insert({
      contact_id:  contact.id,
      event_type:  "sms",
      title:       "Inbound SMS",
      body,
      metadata:    { direction: "inbound", from_number: normalized, openphone_message_id: obj.id },
      created_by:  "system",
    });
  } else {
    const { ingestContact } = await import("@/lib/ingest");
    await ingestContact({
      phone: normalized,
      source: "openphone",
      event_type: "sms",
      event_title: "Inbound SMS",
      event_body: body,
      metadata: { direction: "inbound", openphone_message_id: obj.id },
    });
  }
}
