import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "./LoginForm";
import { clientConfig } from "@/config/client";

export const metadata: Metadata = {
  title: `${clientConfig.proPortalName}: Sign In`,
  robots: { index: false, follow: false },
};

export default function ProSignInPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(ellipse 100% 80% at 50% 0%, #000040 0%, #000010 50%, #000000 100%)",
      }}
    >
      {/* Back link */}
      <Link
        href="/"
        className="absolute top-7 left-7 text-steel text-[9px] tracking-[0.3em] uppercase hover:text-wake transition-colors duration-200 flex items-center gap-2"
      >
        <span aria-hidden="true">←</span> {clientConfig.companyName}
      </Link>

      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Logo + wordmark */}
        <div className="flex flex-col items-center gap-3">
          <Image
            src={clientConfig.logoWhiteSvg}
            alt={clientConfig.companyName}
            width={52}
            height={52}
            className="h-13 w-auto opacity-90"
            priority
          />
          <div className="flex flex-col items-center gap-1">
            <p className="text-wake text-[11px] tracking-[0.5em] uppercase font-semibold">
              {clientConfig.companyShortName}
            </p>
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-navy text-[8px]">◈</span>
              <p className="text-steel text-[9px] tracking-[0.4em] uppercase">Pro</p>
              <span aria-hidden="true" className="text-navy text-[8px]">◈</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="w-full chrome-stage bg-obsidian/80 backdrop-blur-md p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-wake text-lg font-bold tracking-tight">Sign In</h1>
            <p className="text-steel text-[10px] tracking-wide">
              {clientConfig.proPortalName} operations portal
            </p>
          </div>

          <LoginForm />

          <p className="text-steel text-[9px] text-center tracking-wide leading-relaxed">
            Access is restricted to {clientConfig.companyName} personnel.<br />
            Contact{" "}
            <a
              href={`mailto:${clientConfig.email}`}
              className="text-steel-light hover:text-wake transition-colors duration-200"
            >
              {clientConfig.email}
            </a>{" "}
            for access requests.
          </p>
        </div>

        <p className="text-steel text-[9px] tracking-widest uppercase opacity-50">
          {clientConfig.companyName} · {clientConfig.city}, {clientConfig.state}
        </p>
      </div>
    </div>
  );
}
