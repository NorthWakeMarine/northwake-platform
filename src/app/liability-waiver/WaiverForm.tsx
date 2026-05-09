"use client";

import { useActionState, useRef } from "react";
import { submitWaiver, type WaiverState } from "@/app/actions";
import Image from "next/image";
import { clientConfig } from "@/config/client";

type Segment = { text: string; bold?: boolean };
type RichPara = Segment[];

type Section = {
  num: number;
  title: string;
  body?: string;
  bullets?: string[];
  footer?: string;
  paragraphs?: RichPara[];
};

const SECTIONS: Section[] = [
  {
    num: 1,
    title: "Scope of Work",
    body: "NorthWake Marine will perform the services described in the attached estimate, invoice, or service order. Any additional work requested by the customer that falls outside the original scope must be approved in writing through a change order or updated estimate and may result in additional charges.",
  },
  {
    num: 2,
    title: "Acknowledgement of Risks",
    body: "The customer understands that work on vessels, engines, and marine systems involves inherent risks. This includes the possibility of accidental damage, mechanical failure, delays, or the discovery of unforeseen issues during service.\n\nNorthWake Marine will perform all work with reasonable care and professional skill. However, we cannot guarantee against issues caused by normal wear, hidden defects, corrosion, prior repairs, or structural conditions that were not visible before work began.",
  },
  {
    num: 3,
    title: "Customer Representations",
    body: "The customer confirms that:",
    bullets: [
      "They are the legal owner of the vessel or have authorization to approve work on the vessel.",
      "The vessel is properly insured and compliant with all applicable laws and marina regulations.",
      "All personal property, valuables, and loose equipment have been removed prior to service.",
      "The vessel is safe to access and work on and does not contain unsafe conditions.",
    ],
    footer: "NorthWake Marine is not responsible for lost or damaged personal items left on board.",
  },
  {
    num: 4,
    title: "Release of Liability",
    body: "The customer agrees to release and hold harmless NorthWake Marine, its owners, employees, and contractors from any claims, damages, losses, or expenses arising from:",
    bullets: [
      "Damage to the vessel or its contents unless proven to be caused by gross negligence",
      "Delays due to weather, marina restrictions, supply issues, mechanical failures, or other conditions outside of NorthWake Marine's control",
      "Issues caused by pre-existing damage, corrosion, structural defects, prior repairs, or hidden conditions",
    ],
  },
  {
    num: 5,
    title: "Weather Delay Clause",
    body: "Marine detailing and service work are heavily dependent on weather conditions. For the safety of our technicians and to ensure quality results, NorthWake Marine reserves the right to delay, reschedule, or suspend services due to unfavorable weather conditions including rain, lightning, high winds, extreme heat, or unsafe working conditions.\n\nWeather-related delays do not constitute a breach of agreement and may result in adjustments to the service schedule.",
  },
  {
    num: 6,
    title: "Marina Access Limitation Clause",
    body: "NorthWake Marine is not responsible for delays or inability to perform services due to marina access restrictions, dock closures, marina management rules, security limitations, or other access limitations outside of our control.\n\nThe customer is responsible for ensuring that NorthWake Marine has proper access to the vessel at the scheduled time. Any additional trips or delays caused by lack of access may result in additional service charges.",
  },
  {
    num: 7,
    title: "Oxidation & Gelcoat Condition Disclaimer",
    body: "Marine surfaces such as gelcoat, paint, and fiberglass may suffer from oxidation, fading, staining, chalking, or deterioration over time.\n\nWhile polishing, compounding, and protective treatments may improve appearance, NorthWake Marine does not guarantee the full removal of oxidation or restoration of original color and gloss. Severely oxidized, weathered, or damaged surfaces may have permanent discoloration or material degradation that cannot be corrected through detailing alone.",
  },
  {
    num: 8,
    title: "Vinyl Wrap & Decal Disclaimer",
    body: "Many vessels contain vinyl wraps, graphics, registration numbers, or decals that may be aged, brittle, poorly installed, or weakened by UV exposure.\n\nDuring normal cleaning, washing, or maintenance processes there is a risk that these materials may lift, peel, fade, or become damaged due to their condition.\n\nNorthWake Marine is not responsible for damage to vinyl wraps, decals, or graphics that occurs due to pre-existing deterioration, adhesive failure, sun damage, or improper installation.",
  },
  {
    num: 9,
    title: "Warranty Disclaimer",
    body: "Unless otherwise stated in writing, all services are provided \"as is\" without guarantee of future performance.\n\nParts and materials installed during service are covered only by the manufacturer's warranty when applicable.\n\nAny statements regarding the expected lifespan or durability of products such as waxes, sealants, coatings, ceramic protection, or treatments are estimates based on manufacturer guidelines. Actual performance varies based on environmental exposure, usage, storage conditions, and customer maintenance.\n\nNorthWake Marine makes no guarantee regarding the longevity of these products after application.",
  },
  {
    num: 10,
    title: "Media Release Authorization",
    body: "The customer grants NorthWake Marine permission to photograph or record video of the vessel and services being performed.\n\nThese images and recordings may be used for marketing, advertising, training, or social media purposes without additional notice or compensation. The customer waives any rights to the use of such media.",
  },
  {
    num: 11,
    title: "Deposit & Payment Terms",
    paragraphs: [
      [
        { text: "A 25% non-refundable deposit", bold: true },
        { text: " is required to secure scheduling unless otherwise agreed upon in writing by NorthWake Marine." },
      ],
      [
        { text: "For customer-specific parts, materials, or special-order products", bold: true },
        { text: ", full payment may be required prior to ordering." },
      ],
      [
        { text: "Upon completion of the agreed scope of work, the customer will review and sign a " },
        { text: "Completion Confirmation Document", bold: true },
        { text: " acknowledging the work performed." },
      ],
      [
        { text: "The remaining balance will then be charged or invoiced and " },
        { text: "payment in full is due immediately upon completion", bold: true },
        { text: " unless otherwise agreed in writing." },
      ],
      [
        { text: "Failure to pay may result in suspension of services and the right to pursue collection remedies as permitted under Florida law." },
      ],
    ],
  },
  {
    num: 12,
    title: "Governing Law",
    paragraphs: [
      [
        { text: "This agreement shall be governed by and interpreted under the laws of the " },
        { text: "State of Florida", bold: true },
        { text: "." },
      ],
    ],
  },
  {
    num: 13,
    title: "Entire Agreement",
    body: "This waiver, together with the associated estimate, invoice, or service order, represents the entire agreement between the customer and NorthWake Marine. Any modifications must be made in writing and agreed upon by both parties.",
  },
  {
    num: 14,
    title: "Dock Water & Marina Power Liability Disclaimer",
    body: "NorthWake Marine may utilize dockside water supplies and marina-provided electrical power when performing services. These utilities are owned and maintained by the marina or property owner and are outside of NorthWake Marine's control.\n\nNorthWake Marine is not responsible for any issues, damage, or performance problems resulting from marina-provided utilities, including but not limited to:",
    bullets: [
      "Low or inconsistent water pressure",
      "Contaminated or mineral-heavy water supplies that may cause spotting or staining",
      "Electrical surges, faulty dock power, or inadequate electrical supply",
      "Equipment malfunctions caused by marina utility infrastructure",
    ],
    footer: "The customer acknowledges that dock water quality and marina electrical systems vary by location and may impact the results or timing of services. NorthWake Marine will make reasonable efforts to minimize any issues but cannot guarantee the quality or reliability of marina-provided utilities.\n\nNorthWake Marine shall not be held liable for damages, delays, or service limitations resulting from dock water conditions, marina electrical systems, or other utility-related factors outside of our control.",
  },
];

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
