"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { submitLead, type LeadFormState } from "@/app/actions";
import { trackFormStart, trackFormSubmit, trackFormSuccess, trackFormError } from "@/lib/analytics";

const vesselTypes = [
  "Center Console", "Bowrider", "Pontoon", "Cruiser",
  "Motor Yacht", "Sailboat", "Sport Fishing", "Other",
];

const serviceOptions = [
  "Maintenance Wash", "One-Off Wash", "Full Detail", "Exterior Detailing",
  "Interior Cleaning & Cabin Detailing", "Canvas Cleaning & Treatment",
  "Vinyl & Upholstery Conditioning", "Teak Cleaning & Brightening",
  "Stainless Polish", "Engine Bay & Bilge Cleaning",
  "Water Spot & Mineral Deposit Removal", "Ceramic Coating", "Wax Application",
  "Gel Coat Restoration", "Monthly Maintenance Plan", "Marine Transport",
  "Captain & Crew Services", "Yacht Management", "Custom Request",
  "Not Sure, Need Consultation",
];

const referralSources = [
  "Google Search", "Google Maps", "Instagram", "Facebook",
  "Friend / Word of Mouth", "Boat Show", "Marina Referral", "Other",
];

interface QuoteFormProps {
  preselectedService?: string;
  showReferral?: boolean;
  formId?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase py-4 transition-all duration-300 hover:scale-[1.02] mt-2 w-full disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      {pending ? "Submitting…" : "Get My Free Quote →"}
    </button>
  );
}

export default function QuoteForm({
  preselectedService,
  showReferral = false,
  formId = "quote-form",
}: QuoteFormProps) {
  const [state, action] = useActionState<LeadFormState, FormData>(submitLead, {
    success: false,
  });
  const started = useRef(false);

  function handleFirstInteraction() {
    if (!started.current) {
      started.current = true;
      trackFormStart(formId);
    }
  }

  const fieldClass =
    "bg-transparent border border-steel-dark text-wake placeholder-steel text-sm px-4 py-3 focus:outline-none focus:border-navy transition-colors duration-200 w-full [&:user-invalid]:border-red-500";
  const selectClass =
    "bg-obsidian border border-steel-dark text-wake text-sm px-4 py-3 focus:outline-none focus:border-navy transition-colors duration-200 appearance-none cursor-pointer w-full [&:user-invalid]:border-red-500";
  const labelClass =
    "text-steel-light text-[10px] tracking-[0.3em] uppercase font-medium";

  if (state.error) trackFormError(formId, state.error);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!e.currentTarget.checkValidity()) {
      e.preventDefault();
      e.currentTarget.reportValidity();
      return;
    }
    const service = (e.currentTarget.elements.namedItem("service") as HTMLSelectElement)?.value;
    trackFormSubmit(formId, service);
  }

  if (state.success) {
    trackFormSuccess(formId);
    return (
      <div className="w-full flex flex-col items-center justify-center gap-5 py-12 text-center">
        <span aria-hidden="true" className="chrome-text text-4xl">◈</span>
        <h3 className="text-wake text-xl font-bold tracking-tight">
          Request Received
        </h3>
        <p className="text-steel-light text-sm leading-relaxed max-w-sm">
          Thank you. A member of our team will review your request and be in touch shortly.
        </p>
        <p className="text-steel text-xs tracking-wide">
          Questions? Call us at{" "}
          <a href="tel:+19046065454" className="text-link hover:text-wake transition-colors">
            (904) 606-5454
          </a>
        </p>
      </div>
    );
  }

  return (
    <form
      id={formId}
      action={action}
      onSubmit={handleSubmit}
      onFocus={handleFirstInteraction}
      aria-label="Quote request form"
      className="w-full flex flex-col gap-5"
    >
      <input type="hidden" name="source" value="contact" />

      {state.error && (
        <div role="alert" className="border border-red-900/60 bg-red-950/20 px-3.5 py-2.5">
          <p className="text-red-400 text-[10px] tracking-wide">{state.error}</p>
        </div>
      )}

      {/* Row: Name + Email */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-name`} className={labelClass}>
            Full Name <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <input
            id={`${formId}-name`}
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="John Harrington"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-email`} className={labelClass}>
            Email Address <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="john@example.com"
            className={fieldClass}
          />
        </div>
      </div>

      {/* Row: Phone + Vessel Length */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-phone`} className={labelClass}>
            Phone Number <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <input
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="(904) 606-5454"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-vessel-length`} className={labelClass}>
            Vessel Length (ft) <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <input
            id={`${formId}-vessel-length`}
            name="vessel_length"
            type="text"
            required
            placeholder="e.g. 28"
            className={fieldClass}
          />
        </div>
      </div>

      {/* Row: Vessel Type + Service */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-vessel`} className={labelClass}>
            Vessel Type <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <select
            id={`${formId}-vessel`}
            name="vessel_type"
            required
            defaultValue=""
            className={selectClass}
          >
            <option value="" disabled className="text-steel">Select vessel type…</option>
            {vesselTypes.map((v) => (
              <option key={v} value={v} className="bg-obsidian text-wake">{v}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-service`} className={labelClass}>
            Service Needed <span aria-hidden="true" className="text-navy">*</span>
          </label>
          <select
            id={`${formId}-service`}
            name="service"
            required
            defaultValue={preselectedService ?? ""}
            className={selectClass}
          >
            <option value="" disabled className="text-steel">Select a service…</option>
            {serviceOptions.map((s) => (
              <option key={s} value={s} className="bg-obsidian text-wake">{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Referral source */}
      {showReferral && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-referral`} className={labelClass}>
            How Did You Hear About Us?
          </label>
          <select
            id={`${formId}-referral`}
            name="referral_source"
            defaultValue=""
            className={selectClass}
          >
            <option value="" className="text-steel">Prefer not to say</option>
            {referralSources.map((r) => (
              <option key={r} value={r} className="bg-obsidian text-wake">{r}</option>
            ))}
          </select>
        </div>
      )}

      {/* Message */}
      <div className="flex flex-col gap-2">
        <label htmlFor={`${formId}-message`} className={labelClass}>
          Additional Details
        </label>
        <textarea
          id={`${formId}-message`}
          name="message"
          rows={4}
          placeholder="Vessel condition, preferred service dates, specific concerns, or anything else we should know…"
          className="bg-transparent border border-steel-dark text-wake placeholder-steel text-sm px-4 py-3 focus:outline-none focus:border-navy transition-colors duration-200 resize-none w-full"
        />
      </div>

      {/* Terms */}
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          name="terms"
          required
          className="mt-0.5 w-3 h-3 border border-steel-dark bg-transparent accent-navy shrink-0 cursor-pointer"
        />
        <span className="text-steel-light text-[10px] leading-relaxed">
          I agree to the{" "}
          <Link href="/terms" target="_blank" className="text-link hover:text-wake transition-colors underline underline-offset-2">
            terms &amp; conditions
          </Link>
          . By providing my phone number I agree to receive communications from NorthWake Marine.
        </span>
      </label>

      <SubmitButton />

      <p className="text-steel text-[10px] text-center tracking-wide leading-relaxed">
        No obligation. No spam.
      </p>
    </form>
  );
}
