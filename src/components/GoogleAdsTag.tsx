"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const AW_ID = "AW-17918867353";

export default function GoogleAdsTag() {
  const pathname = usePathname();
  if (pathname.startsWith("/pro")) return null;

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${AW_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${AW_ID}');
        `}
      </Script>
    </>
  );
}
