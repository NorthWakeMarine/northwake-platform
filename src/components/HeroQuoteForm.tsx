"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { submitLead, type LeadFormState } from "@/app/actions";
import { trackFormStart, trackFormSubmit, trackFormSuccess, trackFormError } from "@/lib/analytics";
import { clientConfig } from "@/config/client";

const inputCls =
  "bg-white/[0.04] border border-white/15 text-white placeholder-white/30 text-xs px-3 py-2 focus:outline-none focus:border-navy-light focus:bg-white/[0.08] transition-colors duration-200 peer [&:user-invalid]:border-red-400";
const selectCls =
  "bg-white/[0.04] border border-white/15 text-white text-xs px-3 py-2 focus:outline-none focus:border-navy-light focus:bg-white/[0.08] transition-colors duration-200 appearance-none cursor-pointer peer [&:user-invalid]:border-red-400";
const labelCls = "text-white/65 text-xs tracking-[0.2em] uppercase font-medium";
const fieldErr =
  "hidden peer-[&:user-invalid]:block text-red-300 text-[9px] tracking-wide mt-0.5";

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="animate-spin h-3 w-3 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase py-3 transition-all duration-300 hover:scale-[1.02] active:scale-95 w-full disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
    >
      {pending && <Spinner />}
      {pending ? "Submitting…" : "Get My Free Quote →"}
    </button>
  );
}

function FormOverlay() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-black/30 cursor-wait pointer-events-auto z-10 rounded-sm"
    />
  );
}

function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  if (!e.currentTarget.checkValidity()) {
    e.preventDefault();
    e.currentTarget.reportValidity();
    return;
  }
  const service = (e.currentTarget.elements.namedItem("service") as HTMLSelectElement)?.value;
  trackFormSubmit("hero_quote_form", service);
}

export default function HeroQuoteForm() {
  const [state, action] = useActionState<LeadFormState, FormData>(submitLead, {
    success: false,
  });
  const started = useRef(false);

  function handleFirstInteraction() {
    if (!started.current) {
      started.current = true;
      trackFormStart("hero_quote_form");
    }
  }

  if (state.success) {
    trackFormSuccess("hero_quote_form");
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-10 text-center">
        <span aria-hidden="true" className="chrome-text text-3xl">◈</span>
        <h3 className="text-white text-lg font-bold tracking-tight">
          Request Received
        </h3>
        <p className="text-white/65 text-xs leading-relaxed max-w-xs">
          Thank you. Our team will review your request and be in touch shortly.
        </p>
        <a
          href={`tel:${clientConfig.phoneE164}`}
          className="text-navy-light text-xs hover:text-white transition-colors tracking-wide"
        >
          {clientConfig.phone}
        </a>
      </div>
    );
  }

  if (state.error) trackFormError("hero_quote_form", state.error);

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      onFocus={handleFirstInteraction}
      aria-label="Free quote request form"
      className="flex flex-col gap-2.5 relative"
    >
      <FormOverlay />
      <input type="hidden" name="source" value="hero" />
      <p className="text-white/45 text-[10px] tracking-wide">
        Fields marked <span aria-hidden="true" className="text-navy-light font-bold">*</span> are required.
      </p>

      {state.error && (
        <div role="alert" className="border border-red-400/30 bg-red-500/10 px-3 py-2">
          <p className="text-red-300 text-[10px] tracking-wide">{state.error}</p>
        </div>
      )}

      {/* Row: Full Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1">
          <label htmlFor="hero-name" className={labelCls}>
            Full Name <span aria-hidden="true" className="text-navy-light">*</span>
          </label>
          <input id="hero-name" name="name" type="text" required autoComplete="name" placeholder="John Harrington"
            className={inputCls} />
          <span className={fieldErr}>Please enter your full name.</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hero-email" className={labelCls}>
            Email <span aria-hidden="true" className="text-navy-light">*</span>
          </label>
          <input id="hero-email" name="email" type="email" required autoComplete="email" placeholder="john@example.com"
            className={inputCls} />
          <span className={fieldErr}>Please enter a valid email address.</span>
        </div>
      </div>

      {/* Row: Phone + Vessel Length */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1">
          <label htmlFor="hero-phone" className={labelCls}>
            Phone <span aria-hidden="true" className="text-navy-light">*</span>
          </label>
          <input id="hero-phone" name="phone" type="tel" required autoComplete="tel" placeholder={clientConfig.phone}
            className={inputCls} />
          <span className={fieldErr}>Please enter your phone number.</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hero-vessel-length" className={labelCls}>
            Asset Length (ft) <span aria-hidden="true" className="text-navy-light">*</span>
          </label>
          <input id="hero-vessel-length" name="vessel_length" type="text" required placeholder="e.g. 28"
            className={inputCls} />
          <span className={fieldErr}>Please enter your asset length in feet.</span>
        </div>
      </div>

      {/* Row: Vessel Type + Service Needed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1">
          <label htmlFor="hero-vessel" className={labelCls}>
            Asset Type <span aria-hidden="true" className="text-navy-light">*</span>
          </label>
          <select id="hero-vessel" name="vessel_type" required defaultValue=""
            className={selectCls}>
            <option value="" disabled className="bg-[#0a0a18] text-white/40">Select type…</option>
            {["Center Console","Bowrider","Pontoon","Cruiser","Motor Yacht","Sailboat","Sport Fishing","Aircraft","Motorhome / RV","Automobile / Truck","Other"].map(v => (
              <option key={v} value={v} className="bg-[#0a0a18] text-white">{v}</option>
            ))}
          </select>
          <span className={fieldErr}>Please select an asset type.</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hero-service" className={labelCls}>
            Service Needed <span aria-hidden="true" className="text-navy-light">*</span>
          </label>
          <select id="hero-service" name="service" required defaultValue=""
            className={selectCls}>
            <option value="" disabled className="bg-[#0a0a18] text-white/40">Select service…</option>
            {["Maintenance Wash","One-Off Wash","Full Detail","Exterior Detailing","Interior Cleaning & Cabin Detailing","Canvas Cleaning & Treatment","Vinyl & Upholstery Conditioning","Teak Cleaning & Brightening","Stainless Polish","Engine Bay & Bilge Cleaning","Water Spot & Mineral Deposit Removal","Ceramic Coating","Wax Application","Gel Coat Restoration","Yamaha Outboard Maintenance","Monthly Maintenance Plan","Marine Transport","Captain & Crew Services","Yacht Management","Aircraft Detailing","RV Detailing","Automotive Detailing","Custom Request","Not Sure, Need Consultation"].map(s => (
              <option key={s} value={s} className="bg-[#0a0a18] text-white">{s}</option>
            ))}
          </select>
          <span className={fieldErr}>Please select a service.</span>
        </div>
      </div>

      {/* Referral */}
      <div className="flex flex-col gap-1">
        <label htmlFor="hero-referral" className={labelCls}>
          How Did You Hear About Us?
        </label>
        <select id="hero-referral" name="referral_source" defaultValue=""
          className={selectCls}>
          <option value="" className="bg-[#0a0a18] text-white/40">Prefer not to say</option>
          {["Google Search","Google Maps","Instagram","Facebook","TikTok","Friend / Word of Mouth","Boat Show","Marina Referral","Other"].map(r => (
            <option key={r} value={r} className="bg-[#0a0a18] text-white">{r}</option>
          ))}
        </select>
      </div>

      {/* Additional details */}
      <div className="flex flex-col gap-1">
        <label htmlFor="hero-comments" className={labelCls}>
          Additional Details
        </label>
        <textarea id="hero-comments" name="comments" rows={2}
          placeholder="Vessel length, condition, preferred dates…"
          className="bg-white/[0.04] border border-white/15 text-white placeholder-white/30 text-xs px-3 py-2 focus:outline-none focus:border-navy-light focus:bg-white/[0.08] transition-colors duration-200 resize-none" />
      </div>

      {/* Terms */}
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" name="terms" required
          className="mt-0.5 w-3 h-3 border border-white/30 bg-white/[0.04] accent-navy-light shrink-0 cursor-pointer peer" />
        <span className="text-white/55 text-xs leading-relaxed">
          I agree to the{" "}
          <Link href="/terms" target="_blank" className="text-navy-light hover:text-white transition-colors underline underline-offset-2">
            terms &amp; conditions
          </Link>
          . By providing my phone number I agree to receive communications from {clientConfig.companyName}.
        </span>
      </label>

      <SubmitButton />
    </form>
  );
}
