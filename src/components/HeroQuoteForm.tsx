"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { submitLead, type LeadFormState } from "@/app/actions";
import { trackFormStart, trackFormSubmit, trackFormSuccess, trackFormError } from "@/lib/analytics";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase py-3 transition-all duration-300 hover:scale-[1.02] w-full disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      {pending ? "Submitting…" : "Get My Free Quote →"}
    </button>
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
        <h3 className="text-wake text-lg font-bold tracking-tight">
          Request Received
        </h3>
        <p className="text-steel-light text-xs leading-relaxed max-w-xs">
          Thank you. Our team will review your request and be in touch shortly.
        </p>
        <a
          href="tel:+19046065454"
          className="text-link text-xs hover:text-wake transition-colors tracking-wide"
        >
          (904) 606-5454
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
      className="flex flex-col gap-2.5"
    >
      <input type="hidden" name="source" value="hero" />

      {state.error && (
        <div role="alert" className="border border-red-900/60 bg-red-950/20 px-3 py-2">
          <p className="text-red-400 text-[10px] tracking-wide">{state.error}</p>
        </div>
      )}

      {/* Row: Full Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1">
          <label htmlFor="hero-name" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
            Full Name <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <input id="hero-name" name="name" type="text" required autoComplete="name" placeholder="John Harrington"
            className="bg-obsidian/60 border border-steel-dark text-wake placeholder-steel text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200 [&:user-invalid]:border-red-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hero-email" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
            Email <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <input id="hero-email" name="email" type="email" required autoComplete="email" placeholder="john@example.com"
            className="bg-obsidian/60 border border-steel-dark text-wake placeholder-steel text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200 [&:user-invalid]:border-red-500" />
        </div>
      </div>

      {/* Row: Phone + Vessel Length */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1">
          <label htmlFor="hero-phone" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
            Phone <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <input id="hero-phone" name="phone" type="tel" required autoComplete="tel" placeholder="(904) 606-5454"
            className="bg-obsidian/60 border border-steel-dark text-wake placeholder-steel text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200 [&:user-invalid]:border-red-500" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hero-vessel-length" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
            Vessel Length (ft) <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <input id="hero-vessel-length" name="vessel_length" type="text" required placeholder="e.g. 28"
            className="bg-obsidian/60 border border-steel-dark text-wake placeholder-steel text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200 [&:user-invalid]:border-red-500" />
        </div>
      </div>

      {/* Row: Vessel Type + Service Needed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1">
          <label htmlFor="hero-vessel" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
            Vessel Type <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <select id="hero-vessel" name="vessel_type" required defaultValue=""
            className="bg-obsidian border border-steel-dark text-wake text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200 appearance-none cursor-pointer [&:user-invalid]:border-red-500">
            <option value="" disabled className="text-steel">Select type…</option>
            {["Center Console","Bowrider","Pontoon","Cruiser","Motor Yacht","Sailboat","Sport Fishing","Other"].map(v => (
              <option key={v} value={v} className="bg-obsidian text-wake">{v}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hero-service" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
            Service Needed <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <select id="hero-service" name="service" required defaultValue=""
            className="bg-obsidian border border-steel-dark text-wake text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200 appearance-none cursor-pointer [&:user-invalid]:border-red-500">
            <option value="" disabled className="text-steel">Select service…</option>
            {["Maintenance Wash","One-Off Wash","Full Detail","Exterior Detailing","Interior Cleaning & Cabin Detailing","Canvas Cleaning & Treatment","Vinyl & Upholstery Conditioning","Teak Cleaning & Brightening","Stainless Polish","Engine Bay & Bilge Cleaning","Water Spot & Mineral Deposit Removal","Ceramic Coating","Wax Application","Gel Coat Restoration","Monthly Maintenance Plan","Marine Transport","Captain & Crew Services","Yacht Management","Custom Request","Not Sure, Need Consultation"].map(s => (
              <option key={s} value={s} className="bg-obsidian text-wake">{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Referral */}
      <div className="flex flex-col gap-1">
        <label htmlFor="hero-referral" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
          How Did You Hear About Us?
        </label>
        <select id="hero-referral" name="referral_source" defaultValue=""
          className="bg-obsidian border border-steel-dark text-wake text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200 appearance-none cursor-pointer [&:user-invalid]:border-red-500">
          <option value="" className="text-steel">Prefer not to say</option>
          {["Google Search","Google Maps","Instagram","Facebook","TikTok","Friend / Word of Mouth","Boat Show","Marina Referral","Other"].map(r => (
            <option key={r} value={r} className="bg-obsidian text-wake">{r}</option>
          ))}
        </select>
      </div>

      {/* Additional details */}
      <div className="flex flex-col gap-1">
        <label htmlFor="hero-comments" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
          Additional Details
        </label>
        <textarea id="hero-comments" name="comments" rows={2}
          placeholder="Vessel length, condition, preferred dates…"
          className="bg-obsidian/60 border border-steel-dark text-wake placeholder-steel text-xs px-3 py-2 focus:outline-none focus:border-navy transition-colors duration-200 resize-none" />
      </div>

      {/* Terms */}
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" name="terms" required
          className="mt-0.5 w-3 h-3 border border-steel-dark bg-obsidian/60 accent-navy shrink-0 cursor-pointer" />
        <span className="text-steel-light text-[10px] leading-relaxed">
          I agree to the{" "}
          <Link href="/terms" target="_blank" className="text-link hover:text-wake transition-colors underline underline-offset-2">
            terms &amp; conditions
          </Link>
          . By providing my phone number I agree to receive communications from NorthWake Marine.
        </span>
      </label>

      <SubmitButton />
    </form>
  );
}
