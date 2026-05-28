export type Segment = { text: string; bold?: boolean };
export type RichPara = Segment[];

export type Section = {
  num: number;
  title: string;
  body?: string;
  bullets?: string[];
  footer?: string;
  paragraphs?: RichPara[];
};

export const SECTIONS: Section[] = [
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
    body: "Marine detailing and service work are heavily dependent on weather conditions. For the safety of our crew and to ensure quality results, NorthWake Marine reserves the right to delay, reschedule, or suspend services due to unfavorable weather conditions including rain, lightning, high winds, extreme heat, or unsafe working conditions.\n\nWeather-related delays do not constitute a breach of agreement and may result in adjustments to the service schedule.",
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
    body: 'Unless otherwise stated in writing, all services are provided "as is" without guarantee of future performance.\n\nParts and materials installed during service are covered only by the manufacturer\'s warranty when applicable.\n\nAny statements regarding the expected lifespan or durability of products such as waxes, sealants, coatings, ceramic protection, or treatments are estimates based on manufacturer guidelines. Actual performance varies based on environmental exposure, usage, storage conditions, and customer maintenance.\n\nNorthWake Marine makes no guarantee regarding the longevity of these products after application.',
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
