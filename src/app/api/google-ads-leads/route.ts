import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Google Ads Lead Form Extension webhook
// Docs: https://support.google.com/google-ads/answer/9423234

type GoogleAdsLeadPayload = {
  google_key?: string;
  lead_id?: string;
  campaign_id?: string;
  campaign_name?: string;
  adgroup_id?: string;
  adgroup_name?: string;
  form_id?: string;
  form_name?: string;
  user_column_data?: {
    column_id: string;
    column_name: string;
    string_value?: string;
  }[];
};

function get(columns: GoogleAdsLeadPayload["user_column_data"], ...ids: string[]): string | null {
  for (const id of ids) {
    const match = columns?.find(
      (c) => c.column_id === id || c.column_name?.toLowerCase() === id.toLowerCase()
    );
    if (match?.string_value) return match.string_value;
  }
  return null;
}

export async function GET() {
  // Google may ping this URL to verify it's reachable before saving the webhook
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  let body: GoogleAdsLeadPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate the shared secret key set in Google Ads webhook config
  const expectedKey = process.env.GOOGLE_ADS_WEBHOOK_KEY;
  if (expectedKey && body.google_key !== expectedKey) {
    console.warn("Google Ads webhook: invalid key received");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cols = body.user_column_data ?? [];

  const name  = get(cols, "FULL_NAME", "full_name");
  const email = get(cols, "EMAIL", "email");
  const phone = get(cols, "PHONE_NUMBER", "phone_number", "phone");

  // Custom question fields from your lead form
  const vesselType   = get(cols, "VESSEL_TYPE", "vessel_type", "What type of vessel do you have?", "Vessel type");
  const vesselLength = get(cols, "VESSEL_LENGTH", "vessel_length", "Vessel length (feet)", "Length (ft)");
  const service      = get(cols, "SERVICE", "service", "What service are you interested in?", "Service needed");
  const message      = get(cols, "MESSAGE", "message", "COMMENTS", "Additional details", "Anything else?");

  // Require at least one contact method
  if (!email && !phone && !name) {
    return NextResponse.json({ error: "No usable lead data in payload" }, { status: 400 });
  }

  // Build a note about which campaign this came from
  const campaignNote = [
    body.campaign_name ? `Campaign: ${body.campaign_name}` : null,
    body.form_name     ? `Form: ${body.form_name}`         : null,
    body.lead_id       ? `Lead ID: ${body.lead_id}`        : null,
  ].filter(Boolean).join(" | ");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { error } = await supabase.from("leads").insert({
    name:            name || null,
    email:           email ?? `ads-lead-${body.lead_id ?? Date.now()}@googleads.placeholder`,
    phone:           phone || null,
    vessel_type:     vesselType || null,
    vessel_length:   vesselLength || null,
    service:         service || null,
    message:         [message, campaignNote].filter(Boolean).join("\n\n") || null,
    referral_source: body.campaign_name || "Google Ads",
    source:          "google_ads",
  });

  if (error) {
    console.error("Google Ads lead insert failed:", error.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
