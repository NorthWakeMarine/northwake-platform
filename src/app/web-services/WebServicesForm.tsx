"use client";

import { useActionState } from "react";
import { submitWebServicesInquiry, type WebServicesFormState } from "@/app/actions";

const industries = ["Marine", "Automotive", "Aviation", "Other"];
const tiers = ["Launch — $499 setup / $49/mo", "Platform — $999 setup / $99/mo", "Command — $1,499 setup / $149/mo", "AI Receptionist Add-On — +$249/mo", "Not sure yet, just exploring"];

export default function WebServicesForm() {
  const [state, formAction, isPending] = useActionState<WebServicesFormState, FormData>(
    submitWebServicesInquiry,
    { success: false }
  );

  if (state.success) {
    return (
      <div className="border border-green-300 bg-green-50 rounded-sm px-6 py-8 text-center">
        <p className="text-green-800 font-semibold text-sm tracking-wide">Inquiry received.</p>
        <p className="text-green-700 text-sm mt-1">We will be in touch within one business day.</p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">

      {state.error && (
        <div role="alert" className="border border-red-300 bg-red-50 px-4 py-3">
          <p className="text-red-700 text-xs">{state.error}</p>
        </div>
      )}

      <p className="text-xs text-gray-500">Fields marked * are required.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ws-name" className="text-xs font-medium text-gray-700 tracking-wide">Your Name *</label>
          <input
            id="ws-name" name="name" type="text" required autoComplete="name"
            disabled={isPending}
            className="border border-gray-500 bg-white text-gray-900 text-sm px-3.5 py-2.5 focus:outline-none focus:border-navy transition-colors disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ws-company" className="text-xs font-medium text-gray-700 tracking-wide">Business Name *</label>
          <input
            id="ws-company" name="company" type="text" required autoComplete="organization"
            disabled={isPending}
            className="border border-gray-500 bg-white text-gray-900 text-sm px-3.5 py-2.5 focus:outline-none focus:border-navy transition-colors disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ws-email" className="text-xs font-medium text-gray-700 tracking-wide">Email *</label>
          <input
            id="ws-email" name="email" type="email" required autoComplete="email"
            disabled={isPending}
            className="border border-gray-500 bg-white text-gray-900 text-sm px-3.5 py-2.5 focus:outline-none focus:border-navy transition-colors disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ws-phone" className="text-xs font-medium text-gray-700 tracking-wide">Phone</label>
          <input
            id="ws-phone" name="phone" type="tel" autoComplete="tel"
            disabled={isPending}
            className="border border-gray-500 bg-white text-gray-900 text-sm px-3.5 py-2.5 focus:outline-none focus:border-navy transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ws-industry" className="text-xs font-medium text-gray-700 tracking-wide">Your Industry *</label>
          <select
            id="ws-industry" name="industry" required
            disabled={isPending}
            defaultValue=""
            className="border border-gray-500 bg-white text-gray-900 text-sm px-3.5 py-2.5 focus:outline-none focus:border-navy transition-colors disabled:opacity-50"
          >
            <option value="" disabled>Select industry</option>
            {industries.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ws-tier" className="text-xs font-medium text-gray-700 tracking-wide">Tier you are interested in *</label>
          <select
            id="ws-tier" name="tier" required
            disabled={isPending}
            defaultValue=""
            className="border border-gray-500 bg-white text-gray-900 text-sm px-3.5 py-2.5 focus:outline-none focus:border-navy transition-colors disabled:opacity-50"
          >
            <option value="" disabled>Select a tier</option>
            {tiers.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ws-website" className="text-xs font-medium text-gray-700 tracking-wide">Current Website (if any)</label>
        <input
          id="ws-website" name="current_website" type="url" autoComplete="url"
          placeholder="https://"
          disabled={isPending}
          className="border border-gray-500 bg-white text-gray-900 text-sm px-3.5 py-2.5 focus:outline-none focus:border-navy transition-colors disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ws-message" className="text-xs font-medium text-gray-700 tracking-wide">Tell us about your business</label>
        <textarea
          id="ws-message" name="message" rows={4}
          placeholder="Services you offer, how many clients you see per month, any specific features you need..."
          disabled={isPending}
          className="border border-gray-500 bg-white text-gray-900 text-sm px-3.5 py-2.5 focus:outline-none focus:border-navy transition-colors resize-none disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase py-3.5 w-full transition-all duration-300 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isPending ? "Sending..." : "Send Inquiry"}
      </button>
    </form>
  );
}
