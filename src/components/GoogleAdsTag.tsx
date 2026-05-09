"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { clientConfig } from "@/config/client";

export default function GoogleAdsTag() {
  const pathname = usePathname();
  const { googleAds, googleAdsConversionId } = clientConfig.integrations;
  if (!googleAds || !googleAdsConversionId || pathname.startsWith("/pro")) return null;

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsConversionId}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${googleAdsConversionId}');
        `}
      </Script>
    </>
  );
}
