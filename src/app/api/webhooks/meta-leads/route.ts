import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";

// Meta Lead Ads webhook
// Docs: https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieve

// GET: Meta verification handshake — must respond with hub.challenge
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN?.trim()) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST: Meta sends a leadgen_id notification; we fetch the actual lead from Graph API
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify the X-Hub-Signature-256 header so only Meta can post here
  const appSecret = process.env.META_APP_SECRET;
  if (appSecret) {
    const sig = req.headers.get("x-hub-signature-256");
    const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
    if (sig !== expected) {
      console.warn("[meta-leads] invalid signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.object !== "page") {
    return NextResponse.json({ ok: true }); // not a leadgen event, ignore
  }

  const entries = (payload.entry as Array<Record<string, unknown>>) ?? [];
  for (const entry of entries) {
    const changes = (entry.changes as Array<Record<string, unknown>>) ?? [];
    for (const change of changes) {
      if (change.field !== "leadgen") continue;
      const value = change.value as Record<string, unknown>;
      const leadgenId   = value.leadgen_id as string;
      const formId      = value.form_id as string | undefined;
      const adId        = value.ad_id as string | undefined;
      const campaignId  = value.campaign_id as string | undefined;

      // Fetch the actual lead data from Meta Graph API
      const token = process.env.META_PAGE_ACCESS_TOKEN;
      if (!token) {
        console.error("[meta-leads] META_PAGE_ACCESS_TOKEN not set");
        continue;
      }

      let leadData: Record<string, unknown>;
      try {
        const res = await fetch(
          `https://graph.facebook.com/v21.0/${leadgenId}?access_token=${token}`
        );
        leadData = await res.json() as Record<string, unknown>;
        console.log("[meta-leads] graph response:", JSON.stringify(leadData));
      } catch (err) {
        console.error("[meta-leads] failed to fetch lead from Graph API", err);
        continue;
      }

      // field_data is an array of { name, values: [string] }
      const fields = (leadData.field_data as Array<{ name: string; values: string[] }>) ?? [];
      const get = (...keys: string[]) => {
        for (const key of keys) {
          const f = fields.find((f) => f.name.toLowerCase().replace(/[\s_]/g, "_") === key.toLowerCase().replace(/[\s_]/g, "_"));
          if (f?.values?.[0]) return f.values[0];
        }
        return null;
      };

      const fullName    = get("full_name", "name");
      const firstName   = get("first_name");
      const lastName    = get("last_name");
      const name        = fullName || [firstName, lastName].filter(Boolean).join(" ") || null;
      const email       = get("email");
      const phone       = get("phone_number", "phone");
      const vesselType  = get("vessel_type", "what_type_of_vessel_do_you_have", "vessel");
      const vesselLength = get("vessel_length", "length_ft", "length");
      const service     = get("service", "service_needed", "what_service_are_you_interested_in");
      const message     = get("message", "comments", "additional_details", "anything_else");

      if (!name && !email && !phone) {
        console.warn("[meta-leads] no usable contact data in lead", leadgenId);
        continue;
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      const referral = [
        "Meta Ads",
        campaignId ? `campaign:${campaignId}` : null,
        formId     ? `form:${formId}`         : null,
        adId       ? `ad:${adId}`             : null,
      ].filter(Boolean).join(" / ");

      const { error } = await supabase.from("leads").insert({
        name,
        email:           email ?? `meta-lead-${leadgenId}@metaads.placeholder`,
        phone:           phone || null,
        vessel_type:     vesselType || null,
        vessel_length:   vesselLength || null,
        service:         service || null,
        message:         message || null,
        referral_source: referral,
        source:          "meta_ads",
      });

      if (error) {
        console.error("[meta-leads] DB insert failed:", error.message);
        continue;
      }

      // Mirror to contacts + OpenPhone (fire-and-forget)
      (async () => {
        try {
          const { ingestContact } = await import("@/lib/ingest");
          await ingestContact({
            name:          name || undefined,
            email:         email || undefined,
            phone:         phone || undefined,
            vessel_type:   vesselType || undefined,
            vessel_length: vesselLength || undefined,
            source:        "meta_ads",
            event_type:    "lead_created",
            event_title:   "Lead created from Meta Ads",
            metadata: {
              leadgen_id:  leadgenId,
              form_id:     formId,
              ad_id:       adId,
              campaign_id: campaignId,
            },
          });
        } catch { /* non-fatal */ }
      })();
    }
  }

  return NextResponse.json({ ok: true });
}
