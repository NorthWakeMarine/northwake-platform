"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { submitLead, type LeadFormState } from "@/app/actions";
import { trackFormStart, trackFormSubmit, trackFormSuccess, trackFormError } from "@/lib/analytics";
import { clientConfig } from "@/config/client";

const vesselTypes = clientConfig.assetTypes;

const serviceOptions = [
  ...clientConfig.services.map((s) => s.title),
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

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="animate-spin h-3.5 w-3.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function FormOverlay() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-black/10 cursor-wait pointer-events-auto z-10"
    />
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase py-4 transition-all duration-300 hover:scale-[1.02] active:scale-95 mt-2 w-full disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
    >
      {pending && <Spinner />}
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
    "bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400/70 text-sm px-4 py-3 focus:outline-none focus:border-navy transition-colors duration-200 w-full peer [&:user-invalid]:border-red-500";
  const selectClass =
    "bg-white border border-gray-300 text-gray-900 text-sm px-4 py-3 focus:outline-none focus:border-navy transition-colors duration-200 appearance-none cursor-pointer w-full peer [&:user-invalid]:border-red-500";
  const fieldErr =
    "hidden peer-[&:user-invalid]:block text-red-600 text-xs tracking-wide mt-0.5";
  const labelClass =
    "text-gray-500 text-xs tracking-[0.3em] uppercase font-medium";

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
        <span aria-hidden="true" className="chrome-text-dark text-4xl">◈</span>
        <h3 className="text-gray-900 text-xl font-bold tracking-tight">
          Request Received
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
          Thank you. A member of our team will review your request and be in touch shortly.
        </p>
        <p className="text-gray-500 text-xs tracking-wide">
          Questions? Call us at{" "}
          <a href={`tel:${clientConfig.phoneE164}`} className="text-navy hover:text-navy-dark transition-colors">
            {clientConfig.phone}
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
      className="w-full flex flex-col gap-5 relative"
    >
      <FormOverlay />
      <input type="hidden" name="source" value="contact" />

      {state.error && (
        <div role="alert" className="border border-red-300 bg-red-50 px-3.5 py-2.5">
          <p className="text-red-600 text-xs tracking-wide">{state.error}</p>
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
          <span className={fieldErr}>Please enter your full name.</span>
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
          <span className={fieldErr}>Please enter a valid email address.</span>
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
            placeholder={clientConfig.phone}
            className={fieldClass}
          />
          <span className={fieldErr}>Please enter your phone number.</span>
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
          <span className={fieldErr}>Please enter your vessel length in feet.</span>
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
            <option value="" disabled className="text-gray-400">Select vessel type…</option>
            {vesselTypes.map((v) => (
              <option key={v} value={v} className="bg-white text-gray-900">{v}</option>
            ))}
          </select>
          <span className={fieldErr}>Please select a vessel type.</span>
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
            <option value="" disabled className="text-gray-400">Select a service…</option>
            {serviceOptions.map((s) => (
              <option key={s} value={s} className="bg-white text-gray-900">{s}</option>
            ))}
          </select>
          <span className={fieldErr}>Please select a service.</span>
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
            <option value="" className="text-gray-400">Prefer not to say</option>
            {referralSources.map((r) => (
              <option key={r} value={r} className="bg-white text-gray-900">{r}</option>
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
          className="bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400/70 text-sm px-4 py-3 focus:outline-none focus:border-navy transition-colors duration-200 resize-none w-full"
        />
      </div>

      {/* Terms */}
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          name="terms"
          required
          className="mt-0.5 w-3 h-3 border border-gray-300 bg-gray-50 accent-navy shrink-0 cursor-pointer"
        />
        <span className="text-gray-500 text-xs leading-relaxed">
          I agree to the{" "}
          <Link href="/terms" target="_blank" className="text-navy hover:text-navy-dark transition-colors underline underline-offset-2">
            terms &amp; conditions
          </Link>
          . By providing my phone number I agree to receive communications from {clientConfig.companyName}.
        </span>
      </label>

      <SubmitButton />

      <p className="text-gray-500 text-xs text-center tracking-wide leading-relaxed">
        No obligation. No spam.
      </p>
    </form>
  );
}
