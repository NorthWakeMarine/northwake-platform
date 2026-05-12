import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parsePhoneNumberFromString } from "libphonenumber-js";

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

// Zapier Dialpad "New Call" trigger payload fields:
//   phone_number, contact_name, direction (inbound/outbound),
//   duration (seconds), status (completed/missed/voicemail),
//   call_id, recording_url, voicemail_transcript
//
// Zapier Dialpad "New SMS" trigger payload fields:
//   from_number, contact_name, text, message_id

export async function POST(req: NextRequest) {
  const secret = process.env.ZAPIER_WEBHOOK_SECRET;
  if (secret) {
    const provided = req.nextUrl.searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = svc();

  // SMS path
  const fromNumber = body.from_number as string | undefined;
  if (fromNumber) {
    const normalized = normalizePhone(fromNumber);
    if (!normalized) return NextResponse.json({ ok: true });

    const messageBody = body.text as string | undefined;
    if (!messageBody) return NextResponse.json({ ok: true });

    const contact = await findContactByPhone(supabase, normalized);
    if (contact) {
      await supabase.from("timeline_events").insert({
        contact_id: contact.id,
        event_type: "sms",
        title: "Inbound SMS",
        body: messageBody,
        metadata: { direction: "inbound", from_number: normalized, dialpad_message_id: body.message_id ?? null },
        created_by: "system",
      });
    } else {
      const { ingestContact } = await import("@/lib/ingest");
      await ingestContact({
        phone: normalized,
        name: (body.contact_name as string | undefined) ?? undefined,
        source: "dialpad",
        event_type: "sms",
        event_title: "Inbound SMS",
        event_body: messageBody,
        metadata: { direction: "inbound", dialpad_message_id: body.message_id ?? null },
      });
    }

    return NextResponse.json({ ok: true });
  }

  // Call path
  const callerPhone = body.phone_number as string | undefined;
  if (!callerPhone) return NextResponse.json({ ok: true });

  const normalized = normalizePhone(callerPhone);
  if (!normalized) return NextResponse.json({ ok: true });

  // "state" comes from Zapier's "Call State Changed" trigger; "status" is our manual field
  const rawState = (body.state ?? body.status) as string | undefined;
  const status = rawState?.includes("voicemail") ? "voicemail"
    : rawState?.includes("miss") ? "missed"
    : "completed";
  const direction = (body.direction as string | undefined) ?? "inbound";
  const rawDuration = body.duration as number | undefined;
  // Zapier sends duration in milliseconds; convert to seconds
  const duration = rawDuration != null ? Math.round(rawDuration / 1000) : undefined;
  const callerName = (body.contact_name as string | undefined) ?? undefined;
  const transcript = (body.voicemail_transcript as string | undefined) ?? null;

  const contact = await findContactByPhone(supabase, normalized);

  if (status === "missed" || status === "voicemail") {
    if (contact) {
      await supabase.from("timeline_events").insert({
        contact_id: contact.id,
        event_type: "call",
        title: status === "voicemail" ? "Voicemail Received" : "Missed Call",
        body: transcript ?? "No transcript available.",
        metadata: { direction: "inbound", dialpad_call_id: body.call_id ?? null, caller_number: normalized },
        created_by: "system",
      });
    } else {
      const { ingestContact } = await import("@/lib/ingest");
      await ingestContact({
        phone: normalized,
        name: callerName,
        source: "dialpad",
        event_type: "call",
        event_title: status === "voicemail" ? "Voicemail Received" : "Missed Call",
        event_body: transcript ?? "Missed call from unknown number. No transcript.",
        metadata: { direction: "inbound", dialpad_call_id: body.call_id ?? null },
      });
    }
  } else {
    if (contact) {
      await supabase.from("timeline_events").insert({
        contact_id: contact.id,
        event_type: "call",
        title: `${direction === "outbound" ? "Outbound" : "Inbound"} Call`,
        body: duration ? `Duration: ${Math.floor(duration / 60)}m ${duration % 60}s` : "Call completed.",
        metadata: {
          direction,
          duration: duration ?? null,
          recording_url: body.recording_url ?? null,
          dialpad_call_id: body.call_id ?? null,
        },
        created_by: "system",
      });
    } else if (direction === "inbound") {
      const { ingestContact } = await import("@/lib/ingest");
      await ingestContact({
        phone: normalized,
        name: callerName,
        source: "dialpad",
        event_type: "call",
        event_title: "Inbound Call",
        event_body: duration ? `Duration: ${Math.floor(duration / 60)}m ${duration % 60}s` : "Call completed.",
        metadata: { direction, dialpad_call_id: body.call_id ?? null },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
