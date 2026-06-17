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
  if (!header) return false;
  try {
    // Header format: t=<timestamp>,v1=<hex_digest>
    const parts = Object.fromEntries(
      header.split(",").map((p) => {
        const idx = p.indexOf("=");
        return [p.slice(0, idx), p.slice(idx + 1)];
      })
    );
    const timestamp = parts["t"];
    const digest = parts["v1"];
    if (!timestamp || !digest) return false;
    const signed = `${timestamp}.${rawBody}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(signed)
      .digest("hex");
    // Both should be 64-char hex strings — compare safely
    if (digest.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

async function findContactByPhone(
  supabase: AnySupabase,
  phone: string
): Promise<{ id: string; name: string | null; callerName: string | null } | null> {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  // Last 7 digits of the caller's number — used as a cheap fallback filter so we
  // still match contacts whose stored phone is in a non-E.164 format (legacy data
  // like "(904) 606-5454"). We re-normalize candidates in JS before accepting.
  const suffix = normalized.replace(/\D/g, "").slice(-7);
  const sameNumber = (stored: string | null) =>
    !!stored && normalizePhone(stored) === normalized;

  // Check primary contacts first — exact E.164 match, then digit-suffix fallback
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, name")
    .eq("phone", normalized)
    .maybeSingle();
  if (contact) return { id: contact.id, name: contact.name, callerName: contact.name };

  const { data: contactCandidates } = await supabase
    .from("contacts")
    .select("id, name, phone")
    .ilike("phone", `%${suffix}`);
  const contactMatch = (contactCandidates ?? []).find((c: { phone: string | null }) => sameNumber(c.phone));
  if (contactMatch) return { id: contactMatch.id, name: contactMatch.name, callerName: contactMatch.name };

  // Check linked (household) contacts — resolve to primary contact, use linked name as caller
  const { data: linked } = await supabase
    .from("linked_contacts")
    .select("id, name, primary_contact_id, phone")
    .ilike("phone", `%${suffix}`);
  const linkedMatch = (linked ?? []).find((l: { phone: string | null }) => sameNumber(l.phone));
  if (linkedMatch) {
    const { data: primary } = await supabase
      .from("contacts")
      .select("id, name")
      .eq("id", linkedMatch.primary_contact_id)
      .maybeSingle();
    if (primary) return { id: primary.id, name: primary.name, callerName: linkedMatch.name };
  }

  return null;
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

  // OpenPhone payload varies: sometimes event is under payload.object (nested),
  // sometimes payload.object is just the string "event" and data is at the top level
  const event = (typeof payload.object === "object" && payload.object !== null
    ? payload.object
    : payload) as Record<string, unknown>;
  const type = event.type as string | undefined;
  const obj = (event.data as Record<string, unknown>)?.object as Record<string, unknown> | undefined;
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
  // Reject SMS short codes and verification senders (e.g. "57564", "22000").
  // Real US/intl numbers normalize to E.164 with 10+ digits; anything shorter
  // is not a callable lead.
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return;

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
    email: "",
  });
}

// OpenPhone sometimes sends `from`/`to` as a string or as a string array — normalise both
function extractPhone(val: unknown): string | undefined {
  if (typeof val === "string") return val || undefined;
  if (Array.isArray(val) && val.length > 0) return String(val[0]) || undefined;
  return undefined;
}

async function handleCompletedCall(obj: Record<string, unknown>) {
  const supabase = svc();
  const rawDirection = (obj.direction as string | undefined) ?? "incoming";
  const isInbound = rawDirection === "inbound" || rawDirection === "incoming";
  const direction = isInbound ? "inbound" : "outbound";
  const callerPhone = isInbound
    ? extractPhone(obj.from)
    : extractPhone(obj.to);
  if (!callerPhone) return;

  const normalized = normalizePhone(callerPhone);
  if (!normalized) return;

  let duration: number | null = null;
  if (obj.answeredAt && obj.completedAt) {
    const ms = new Date(obj.completedAt as string).getTime() - new Date(obj.answeredAt as string).getTime();
    duration = Math.floor(ms / 1000);
  }

  const contact = await findContactByPhone(supabase, normalized);

  const callerLabel = contact?.callerName ? ` (${contact.callerName})` : "";
  const callTitle = direction === "outbound" ? `Outbound Call${callerLabel}` : `Inbound Call${callerLabel}`;

  console.log("[quo webhook] inserting call", { direction, normalized, duration, contact_id: contact?.id ?? null });
  const { error: callErr } = await supabase.from("timeline_events").insert({
    contact_id: contact?.id ?? null,
    event_type: "call",
    title:      callTitle,
    body:       duration != null
      ? `Duration: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`
      : "Call completed.",
    metadata:   { direction, duration, caller_number: normalized, caller_name: contact?.callerName ?? null, recording_url: obj.recordingUrl ?? null, quo_call_id: obj.id },
    created_by: "system",
  });
  console.log("[quo webhook] call insert result", { error: callErr ?? null });

  // Unknown inbound caller who actually talked (>20s) becomes a lead — filters pocket dials
  // Skip if the number belongs to a linked/household contact (already resolved to primary)
  if (!contact && direction === "inbound" && (duration ?? 0) > 20) {
    await createQuoLead(supabase, normalized);
  }
}

async function handleMissedCall(obj: Record<string, unknown>) {
  const supabase = svc();
  const rawDirection = (obj.direction as string | undefined) ?? "incoming";
  const isInbound = rawDirection === "inbound" || rawDirection === "incoming";
  const direction = isInbound ? "inbound" : "outbound";

  // For inbound missed calls the caller is in `from`; for outbound (voicemail left) it's `to`
  const contactPhone = isInbound
    ? extractPhone(obj.from)
    : extractPhone(obj.to);
  if (!contactPhone) return;

  const normalized = normalizePhone(contactPhone);
  if (!normalized) return;

  const contact = await findContactByPhone(supabase, normalized);

  const callerLabel = contact?.callerName ? ` (${contact.callerName})` : "";
  const title = direction === "outbound" ? "Voicemail Left" : `Missed Call${callerLabel}`;
  const body  = direction === "outbound" ? "Outbound call — went to voicemail." : "Missed call. No voicemail.";

  const { error: missedErr } = await supabase.from("timeline_events").insert({
    contact_id: contact?.id ?? null,
    event_type: "call",
    title,
    body,
    metadata:   { direction, caller_number: normalized, caller_name: contact?.callerName ?? null, quo_call_id: obj.id },
    created_by: "system",
  });
  if (missedErr) console.error("[quo webhook] missed call insert error", missedErr);

  // Only create a lead for inbound missed calls — outbound means we already know them
  // Skip if the number belongs to a linked/household contact (already resolved to primary)
  if (!contact && direction === "inbound") {
    await createQuoLead(supabase, normalized);
  }
}

async function handleInboundSms(obj: Record<string, unknown>) {
  const supabase = svc();
  const from = extractPhone(obj.from);
  const body = obj.body as string | undefined;
  if (!from || !body) return;

  const normalized = normalizePhone(from);
  if (!normalized) return;

  const contact = await findContactByPhone(supabase, normalized);

  const smsTitle = contact?.callerName ? `Inbound SMS (${contact.callerName})` : "Inbound SMS";

  const { error: smsErr } = await supabase.from("timeline_events").insert({
    contact_id: contact?.id ?? null,
    event_type: "sms",
    title:      smsTitle,
    body,
    metadata:   { direction: "inbound", from_number: normalized, caller_name: contact?.callerName ?? null, quo_message_id: obj.id },
    created_by: "system",
  });
  if (smsErr) console.error("[quo webhook] sms insert error", smsErr);

  if (!contact) {
    const trimmed = body.trim();
    const replyKeywords = /^(stop|unstop|start|cancel|end|quit|unsubscribe|help|yes|no|y|n|ok|okay)$/i;
    // Verification/OTP messages from automated senders. Any mention of "code"
    // is treated as a verification SMS — real prospects describe their boat,
    // they don't say "code".
    const verificationPatterns = /\bcode\b|\b(otp|2fa|two[- ]?factor|passcode|do not share|don't share)\b|^G-\d{4,}/i;
    const isJustCode = /^[A-Z]?-?\d{4,8}$/.test(trimmed);

    if (
      trimmed.length > 3 &&
      !replyKeywords.test(trimmed) &&
      !verificationPatterns.test(trimmed) &&
      !isJustCode
    ) {
      await createQuoLead(supabase, normalized);
    }
  }
}

async function handleOutboundSms(obj: Record<string, unknown>) {
  const supabase = svc();
  // message.delivered: from = our number, to = customer's number
  const to = extractPhone(obj.to);
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

    // Backfill name on any matching lead rows that still have no name
    if (fullName && phones.length > 0) {
      await supabase
        .from("leads")
        .update({ name: fullName })
        .in("phone", phones)
        .is("name", null);
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
