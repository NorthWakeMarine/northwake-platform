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

function verifyDialpadSignature(body: string, signature: string): boolean {
  const secret = process.env.DIALPAD_WEBHOOK_SECRET;
  if (!secret) return true;
  try {
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-dialpad-signature") ?? "";

  if (!verifyDialpadSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }


  // Native subscription format uses `state` (hangup/voicemail) and `from_number` for SMS.
  // OAuth webhook format uses `event` (call.completed/call.missed/sms.inbound).
  // Normalize to a single event type string.
  const state = event.state as string | undefined;
  const rawEvent = event.event as string | undefined;

  let eventType: string;
  if (rawEvent) {
    eventType = rawEvent;
  } else if (state === "hangup") {
    eventType = "call.completed";
  } else if (state === "voicemail") {
    eventType = "call.voicemail";
  } else if (state === "sms" || (event.from_number && !state)) {
    eventType = "sms.inbound";
  } else {
    return NextResponse.json({ ok: true });
  }

  if (eventType === "call.missed" || eventType === "call.voicemail") {
    await handleMissedCall(event);
  } else if (eventType === "call.completed") {
    await handleCompletedCall(event);
  } else if (eventType === "sms.inbound") {
    await handleInboundSms(event);
  }

  return NextResponse.json({ ok: true });
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

async function handleMissedCall(event: Record<string, unknown>) {
  const supabase = svc();
  const callerPhone = (event.caller_number ?? event.external_number) as string | undefined;
  if (!callerPhone) return;

  const normalized = normalizePhone(callerPhone);
  if (!normalized) return;

  const contact = await findContactByPhone(supabase, normalized);

  if (contact) {
    const transcript = (event.voicemail_transcript as string | undefined) ?? null;
    await supabase.from("timeline_events").insert({
      contact_id:  contact.id,
      event_type:  "call",
      title:       event.event === "call.voicemail" ? "Voicemail Received" : "Missed Call",
      body:        transcript ?? "No transcript available.",
      metadata:    {
        direction: "inbound",
        dialpad_call_id: event.call_id,
        caller_number: normalized,
      },
      created_by: "system",
    });
  } else {
    const { ingestContact } = await import("@/lib/ingest");
    const transcript = (event.voicemail_transcript as string | undefined) ?? null;
    const callerName = (event.caller_name as string | undefined) ?? undefined;

    await ingestContact({
      phone: normalized,
      name: callerName,
      source: "dialpad",
      event_type: "call",
      event_title: event.event === "call.voicemail" ? "Voicemail Received" : "Missed Call",
      event_body: transcript ?? "Missed call from unknown number. No transcript.",
      metadata: { direction: "inbound", dialpad_call_id: event.call_id },
    });
  }
}

async function handleCompletedCall(event: Record<string, unknown>) {
  const supabase = svc();
  const callerPhone = (event.caller_number ?? event.external_number) as string | undefined;
  if (!callerPhone) return;

  const contact = await findContactByPhone(supabase, callerPhone);
  if (!contact) return;

  const duration = event.duration as number | undefined;
  const direction = (event.direction as string | undefined) ?? "inbound";

  await supabase.from("timeline_events").insert({
    contact_id:  contact.id,
    event_type:  "call",
    title:       `${direction === "outbound" ? "Outbound" : "Inbound"} Call`,
    body:        duration ? `Duration: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s` : "Call completed.",
    metadata:    {
      direction,
      duration: duration ?? null,
      recording_url: event.recording_url ?? null,
      dialpad_call_id: event.call_id,
    },
    created_by: "system",
  });
}

async function handleInboundSms(event: Record<string, unknown>) {
  const supabase = svc();
  const fromPhone = (event.from_number ?? event.from) as string | undefined;
  const messageBody = (event.text ?? event.body ?? event.message) as string | undefined;
  if (!fromPhone || !messageBody) return;

  const normalized = normalizePhone(fromPhone);
  if (!normalized) return;

  const contact = await findContactByPhone(supabase, normalized);

  if (contact) {
    await supabase.from("timeline_events").insert({
      contact_id:  contact.id,
      event_type:  "sms",
      title:       "Inbound SMS",
      body:        messageBody,
      metadata:    { direction: "inbound", from_number: normalized, dialpad_message_id: event.message_id },
      created_by:  "system",
    });
  } else {
    const { ingestContact } = await import("@/lib/ingest");
    await ingestContact({
      phone: normalized,
      source: "dialpad",
      event_type: "sms",
      event_title: "Inbound SMS",
      event_body: messageBody,
      metadata: { direction: "inbound", dialpad_message_id: event.message_id },
    });
  }
}
