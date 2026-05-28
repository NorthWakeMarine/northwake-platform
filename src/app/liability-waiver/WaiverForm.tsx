"use client";

import { useActionState, useRef } from "react";
import { submitWaiver, type WaiverState } from "@/app/actions";
import Image from "next/image";
import { clientConfig } from "@/config/client";
import { SECTIONS, type Section, type RichPara } from "@/lib/waiver-sections";

function RichParagraph({ segs }: { segs: RichPara }) {
  return (
    <p className="text-slate-600 text-sm leading-relaxed">
      {segs.map((seg, i) =>
        seg.bold
          ? <strong key={i} className="text-slate-800 font-semibold">{seg.text}</strong>
          : <span key={i}>{seg.text}</span>
      )}
    </p>
  );
}

function SectionBlock({ s }: { s: Section }) {
  return (
    <div className="border-b border-slate-100 pb-6 mb-6 last:border-0 last:mb-0 last:pb-0">
      <h3 className="text-slate-900 font-semibold text-sm mb-3">
        {s.num}. {s.title}
      </h3>

      {s.body && (
        <div className="flex flex-col gap-3">
          {s.body.split("\n\n").map((para, i) => (
            <p key={i} className="text-slate-600 text-sm leading-relaxed">{para}</p>
          ))}
        </div>
      )}

      {s.bullets && (
        <ul className="mt-3 flex flex-col gap-2">
          {s.bullets.map((b, i) => (
            <li key={i} className="text-slate-600 text-sm leading-relaxed flex gap-2.5">
              <span className="text-slate-400 shrink-0 mt-px">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {s.footer && (
        <div className="mt-3 flex flex-col gap-3">
          {s.footer.split("\n\n").map((para, i) => (
            <p key={i} className="text-slate-600 text-sm leading-relaxed">{para}</p>
          ))}
        </div>
      )}

      {s.paragraphs && (
        <div className="flex flex-col gap-3">
          {s.paragraphs.map((segs, i) => (
            <RichParagraph key={i} segs={segs} />
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  contactId?: string;
  prefill?: { name?: string; email?: string; phone?: string };
};

export default function WaiverForm({ contactId, prefill }: Props) {
  const [state, action, isPending] = useActionState<WaiverState, FormData>(submitWaiver, {});
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!e.currentTarget.checkValidity()) {
      e.preventDefault();
      e.currentTarget.reportValidity();
    }
  };

  if (state.success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-sm p-10 max-w-md w-full text-center flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <h2 className="text-slate-900 text-xl font-bold">Waiver Submitted</h2>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              Your liability waiver has been received and recorded. {clientConfig.companyName} will be in touch to confirm your service details.
            </p>
          </div>
          <p className="text-slate-400 text-xs">{clientConfig.companyName}, {clientConfig.city}, {clientConfig.state}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-[#06061a] border-b border-white/[0.07]">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-4">
          <div className="w-9 h-9 bg-[#000080] flex items-center justify-center shrink-0">
            <Image src={clientConfig.logoWhiteSvg} alt={clientConfig.companyName} width={20} height={20} className="opacity-90" />
          </div>
          <div className="leading-none">
            <p className="text-white text-[11px] font-bold tracking-wide">{clientConfig.companyName}</p>
            <p className="text-white/35 text-[9px] tracking-[0.3em] uppercase mt-0.5">{clientConfig.city}, {clientConfig.state}</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Document title */}
        <div className="mb-8">
          <h1 className="text-slate-900 text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
            {clientConfig.companyName} General Liability<br />Waiver &amp; Service Agreement
          </h1>
          <p className="text-slate-500 text-sm mt-3 leading-relaxed">
            Please read and complete this form carefully before services. All fields marked with an asterisk (*) are required.
          </p>
          <div className="mt-5 h-px bg-slate-200" />
        </div>

        <form ref={formRef} action={action} onSubmit={handleSubmit} className="flex flex-col gap-5">
          {contactId && <input type="hidden" name="contact_id" value={contactId} />}

          {/* Customer info fields */}
          <div className="bg-white border border-slate-200 rounded-sm p-6 flex flex-col gap-6">
            <Field num={1} label="Customer Name" name="name" required defaultValue={prefill?.name} />
            <Field num={2} label="Customer Address" name="address" required />
            <Field num={3} label="Customer Phone Number" name="phone" type="tel" required defaultValue={prefill?.phone} />
            <Field num={4} label="Customer Email Address" name="email" type="email" required defaultValue={prefill?.email} />
            <Field num={5} label="Boat Make / Model / Year" name="boat" required />
          </div>

          {/* Legal sections */}
          <div className="bg-white border border-slate-200 rounded-sm p-6 sm:p-8">
            <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 mb-6">Agreement Terms</p>
            {SECTIONS.map((s) => (
              <SectionBlock key={s.num} s={s} />
            ))}
          </div>

          {/* Acknowledgment */}
          <div className="bg-white border border-slate-200 rounded-sm p-6">
            <p className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 mb-4">Acknowledgment</p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="acknowledged"
                required
                className="mt-1 w-4 h-4 shrink-0 accent-[#000080] cursor-pointer"
              />
              <span className="text-slate-700 text-sm leading-relaxed">
                I have read, understand, and acknowledge the Release of Liability, and I agree to be bound by its terms.
              </span>
            </label>
          </div>

          {/* Date + Signature */}
          <div className="bg-white border border-slate-200 rounded-sm p-6 flex flex-col gap-6">
            <Field num={7} label="Today's Date" name="date" required placeholder="Example: January 7, 2026" />
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                <span className="text-slate-400 text-xs mr-1.5">8.</span>
                Customer Digital Signature (Full Legal Name)<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                name="signature"
                required
                placeholder="Type your full legal name"
                className="w-full border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-sm italic px-3 py-3 focus:outline-none focus:border-[#000080] transition-colors rounded-sm font-medium tracking-wide"
              />
              <p className="text-slate-400 text-[11px] mt-2 leading-relaxed">
                By typing your full legal name above, you are providing a legally binding digital signature.
              </p>
            </div>
          </div>

          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#000080] hover:bg-[#0000a0] text-white font-semibold text-sm tracking-wide py-4 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Submitting..." : "Submit Waiver & Service Agreement"}
          </button>

          <p className="text-slate-400 text-[11px] text-center pb-6 leading-relaxed">
            By submitting this form you agree that you have read and understood all terms above.
            This agreement is governed by the laws of the State of Florida.
          </p>
        </form>

      </div>
    </div>
  );
}

function Field({
  num, label, name, type = "text", required, placeholder, defaultValue,
}: {
  num: number; label: string; name: string; type?: string; required?: boolean; placeholder?: string; defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-slate-700 text-sm font-medium mb-2">
        <span className="text-slate-400 text-xs mr-1.5">{num}.</span>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full border-0 border-b border-slate-300 bg-transparent text-slate-800 text-sm px-0 py-2 focus:outline-none focus:border-[#000080] transition-colors placeholder:text-slate-400"
      />
    </div>
  );
}
