import { NextRequest, NextResponse } from "next/server";
import { saveQbTokens } from "@/lib/quickbooks";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const realmId = searchParams.get("realmId");

  if (!code || !realmId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/pro/integrations?qb_error=missing_params`
    );
  }

  const clientId = process.env.QB_CLIENT_ID!;
  const clientSecret = process.env.QB_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const tokenRes = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.QB_REDIRECT_URI!,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("QB token exchange failed:", err);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/pro/integrations?qb_error=token_exchange`
      );
    }

    const body = await tokenRes.json();
    await saveQbTokens({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      realm_id: realmId,
      expires_at: new Date(Date.now() + body.expires_in * 1000).toISOString(),
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/pro/integrations?qb_connected=1`
    );
  } catch (err) {
    console.error("QB OAuth callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/pro/integrations?qb_error=server_error`
    );
  }
}
