import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Google Ads Lead Form Extension webhook
// Docs: https://support.google.com/google-ads/answer/9423234

const ColumnSchema = z.object({
  column_id: z.string(),
  column_name: z.string().optional(),
  string_value: z.string().optional(),
});

const GoogleAdsLeadSchema = z.object({
  google_key:        z.string().optional(),
  lead_id:           z.string().optional(),
  campaign_id:       z.union([z.string(), z.number()]).optional(),
  campaign_name:     z.string().optional(),
  adgroup_id:        z.union([z.string(), z.number()]).optional(),
  adgroup_name:      z.string().optional(),
  form_id:           z.union([z.string(), z.number()]).optional(),
  form_name:         z.string().optional(),
  creative_id:       z.union([z.string(), z.number()]).optional(),
  gcl_id:            z.string().optional(),
  api_version:       z.string().optional(),
  is_test:           z.boolean().optional(),
  user_column_data:  z.array(ColumnSchema).optional(),
}).passthrough();

type GoogleAdsLeadPayload = z.infer<typeof GoogleAdsLeadSchema>;

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
    const raw = await req.json();
    console.log("[google-ads] raw payload:", JSON.stringify(raw, null, 2));
    const parsed = GoogleAdsLeadSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("[google-ads] Zod validation failed:", JSON.stringify(parsed.error.issues));
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    body = parsed.data;
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

  const firstName = get(cols, "FIRST_NAME", "first_name", "First Name");
  const lastName  = get(cols, "LAST_NAME", "last_name", "Last Name");
  const name  = get(cols, "FULL_NAME", "full_name") || [firstName, lastName].filter(Boolean).join(" ") || null;
  const email = get(cols, "EMAIL", "email");
  const phone = get(cols, "PHONE_NUMBER", "phone_number", "phone");

  // Custom question fields from your lead form
  const vesselType   = get(cols, "VESSEL_TYPE", "vessel_type", "Tell us about your vessel", "What type of vessel do you have?", "Vessel type");
  const vesselLength = get(cols, "VESSEL_LENGTH", "vessel_length", "Vessel length (feet)", "Length (ft)");
  const service      = get(cols, "SERVICE", "service", "Request a Free Quote", "What service are you interested in?", "Service needed");
  const message      = get(cols, "MESSAGE", "message", "COMMENTS", "Additional details", "Anything else?");

  // Require at least one contact method
  if (!email && !phone && !name) {
    return NextResponse.json({ error: "No usable lead data in payload" }, { status: 400 });
  }

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
    message:         message || null,
    referral_source: [body.campaign_name, body.form_name].filter(Boolean).join(" / ") || "Google Ads",
    source:          "google_ads",
  });

  if (error) {
    console.error("Google Ads lead insert failed:", error.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
