import { NextRequest, NextResponse } from "next/server";
import { saveDialpadTokens } from "@/lib/dialpad";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/pro/integrations?dp_error=missing_code`
    );
  }

  try {
    const tokenRes = await fetch("https://dialpad.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DIALPAD_REDIRECT_URI!,
        client_id: process.env.DIALPAD_CLIENT_ID!,
        client_secret: process.env.DIALPAD_CLIENT_SECRET!,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Dialpad token exchange failed:", err);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/pro/integrations?dp_error=token_exchange`
      );
    }

    const body = await tokenRes.json();
    await saveDialpadTokens({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      expires_at: new Date(Date.now() + (body.expires_in ?? 3600) * 1000).toISOString(),
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/pro/integrations?dp_connected=1`
    );
  } catch (err) {
    console.error("Dialpad OAuth callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/pro/integrations?dp_error=server_error`
    );
  }
}
