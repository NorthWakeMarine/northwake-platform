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
  const secret = process.env.QUO_WEBHOOK_SECRET;
  if (!secret) return true;
  try {
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
    // Quo has no separate call.missed event — missed calls arrive as call.completed with no answeredAt
    const answered = !!(obj.answeredAt);
    if (answered) {
      await handleCompletedCall(obj);
    } else {
      await handleMissedCall(obj);
    }
  } else if (type === "message.received") {
    await handleInboundSms(obj);
  } else if (type === "message.delivered") {
    await handleOutboundSms(obj);
  } else if (type === "contact.updated") {
    await handleContactUpsert(obj);
  } else if (type === "contact.deleted") {
    await handleContactDeleted(obj);
  }

  return NextResponse.json({ ok: true });
}

async function createQuoLead(supabase: AnySupabase, phone: string) {
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  if (existing) return;

  await supabase.from("leads").insert({
    phone,
    source: "quo",
    name: null,
    email: null,
  });
}

async function handleCompletedCall(obj: Record<string, unknown>) {
  const supabase = svc();
  const direction = (obj.direction as string | undefined) ?? "inbound";
  const callerPhone = direction === "inbound"
    ? (obj.from as string | undefined)
    : (obj.to as string | undefined);
  if (!callerPhone) return;

  const normalized = normalizePhone(callerPhone);
  if (!normalized) return;

  let duration: number | null = null;
  if (obj.answeredAt && obj.completedAt) {
    const ms = new Date(obj.completedAt as string).getTime() - new Date(obj.answeredAt as string).getTime();
    duration = Math.floor(ms / 1000);
  }

  const contact = await findContactByPhone(supabase, normalized);

  await supabase.from("timeline_events").insert({
    contact_id: contact?.id ?? null,
    event_type: "call",
    title:      direction === "outbound" ? "Outbound Call" : "Inbound Call",
    body:       duration != null
      ? `Duration: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`
      : "Call completed.",
    metadata:   { direction, duration, caller_number: normalized, recording_url: obj.recordingUrl ?? null, quo_call_id: obj.id },
    created_by: "system",
  });

  // Unknown inbound caller who actually talked (>5s) becomes a lead
  if (!contact && direction === "inbound" && (duration ?? 0) > 5) {
    await createQuoLead(supabase, normalized);
  }
}

async function handleMissedCall(obj: Record<string, unknown>) {
  const supabase = svc();
  const from = obj.from as string | undefined;
  if (!from) return;

  const normalized = normalizePhone(from);
  if (!normalized) return;

  const contact = await findContactByPhone(supabase, normalized);

  await supabase.from("timeline_events").insert({
    contact_id: contact?.id ?? null,
    event_type: "call",
    title:      "Missed Call",
    body:       "Missed call. No voicemail.",
    metadata:   { direction: "inbound", caller_number: normalized, quo_call_id: obj.id },
    created_by: "system",
  });

  if (!contact) {
    await createQuoLead(supabase, normalized);
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

  await supabase.from("timeline_events").insert({
    contact_id: contact?.id ?? null,
    event_type: "sms",
    title:      "Inbound SMS",
    body,
    metadata:   { direction: "inbound", from_number: normalized, quo_message_id: obj.id },
    created_by: "system",
  });

  if (!contact) {
    const trimmed = body.trim();
    const spamPatterns = /^(stop|unstop|start|cancel|end|quit|unsubscribe|help|yes|no|y|n|ok|okay)$/i;
    if (trimmed.length > 3 && !spamPatterns.test(trimmed)) {
      await createQuoLead(supabase, normalized);
    }
  }
}

async function handleOutboundSms(obj: Record<string, unknown>) {
  const supabase = svc();
  // message.delivered: from = our number, to = customer's number
  const to = obj.to as string | undefined;
  const body = obj.body as string | undefined;
  if (!to || !body) return;

  const normalized = normalizePhone(to);
  if (!normalized) return;

  const contact = await findContactByPhone(supabase, normalized);
  if (!contact) return; // only log outbound SMS against known contacts

  await supabase.from("timeline_events").insert({
    contact_id: contact.id,
    event_type: "sms",
    title:      "Outbound SMS",
    body,
    metadata:   { direction: "outbound", to_number: normalized, quo_message_id: obj.id },
    created_by: "system",
  });
}

async function handleContactUpsert(obj: Record<string, unknown>) {
  const supabase = svc();
  try {
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
    console.error("Quo contact webhook error:", err);
  }
}

async function handleContactDeleted(obj: Record<string, unknown>) {
  const supabase = svc();
  try {
    const fields = (obj.defaultFields as Record<string, unknown> | undefined) ?? obj;
    type PhoneEntry = { value?: string | null };
    const rawPhones = ((fields.phoneNumbers ?? obj.phoneNumbers) as PhoneEntry[] | undefined) ?? [];
    const phones = rawPhones.map((p) => normalizePhone(p.value ?? null)).filter((p): p is string => !!p);

    for (const phone of phones) {
      await supabase.from("contacts").update({ openphone_contact_id: null }).eq("phone", phone);
    }
  } catch (err) {
    console.error("Quo contact deleted webhook error:", err);
  }
}
