import { NextRequest, NextResponse } from "next/server";

// Meta Lead Ads via Zapier
// Zapier fetches the lead from Graph API and sends a flat JSON to this endpoint.
// Wire up in Zapier: Meta Lead Ads (trigger) -> Webhooks by Zapier POST -> this URL

export async function POST(req: NextRequest) {
  // Optional shared secret — set ZAPIER_WEBHOOK_SECRET in Vercel env vars and
  // add it as a query param in the Zapier webhook URL: ?secret=YOUR_SECRET
  const secret = process.env.ZAPIER_WEBHOOK_SECRET;
  if (secret) {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("secret") !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, string | undefined>;
  try {
    body = await req.json() as Record<string, string | undefined>;
    console.log("[meta-leads-zapier] payload:", JSON.stringify(body));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Zapier sends lead fields as top-level keys. Field names vary depending on
  // what you named your form questions in Meta Ads Manager.
  const get = (...keys: string[]): string | null => {
    for (const key of keys) {
      const val = body[key] ?? body[key.toLowerCase()] ?? body[key.replace(/ /g, "_").toLowerCase()];
      if (val) return val;
    }
    return null;
  };

  const fullName  = get("full_name", "name", "Full Name");
  const firstName = get("first_name", "First Name");
  const lastName  = get("last_name", "Last Name");
  const name      = fullName || [firstName, lastName].filter(Boolean).join(" ") || null;
  const email     = get("email", "Email");
  const phone     = get("phone_number", "phone", "Phone", "Phone Number");
  const vesselType   = get("vessel_type", "Vessel Type", "What type of vessel do you have?");
  const vesselLength = get("vessel_length", "Vessel Length", "Length (ft)");
  const service      = get("service", "Service", "Service Needed", "What service are you interested in?");
  const message      = get("message", "Message", "comments", "Additional Details", "Anything else?");
  const adName       = get("ad_name", "Ad Name");
  const campaignName = get("campaign_name", "Campaign Name");
  const formName     = get("form_name", "Form Name");

  if (!name && !email && !phone) {
    console.warn("[meta-leads-zapier] no usable contact data");
    return NextResponse.json({ error: "No usable lead data" }, { status: 400 });
  }

  const referral = ["Meta Ads", campaignName, adName, formName].filter(Boolean).join(" / ");

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
      event_body:    message || undefined,
      metadata: { campaign_name: campaignName, ad_name: adName, form_name: formName, service, referral_source: referral || "Meta Ads" },
    });
  } catch (err) {
    console.error("[meta-leads-zapier] ingest failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
