// ─────────────────────────────────────────────────────────────────────────────
// Client Config — all company-specific values live here.
// To spin up a new client, duplicate this file with their values.
// Nothing in this file should ever reference another client's data.
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceItem = {
  id: string;
  icon: string;
  tier: string;
  badge?: string | null;
  title: string;
  tagline: string;
  description: string;
  includes: string[];
  schemaDescription: string;
};

export type SocialLink = {
  id: string;
  platform: string;
  handle: string;
  href: string;
  description: string;
  cta: string;
  accent: string;
};

export type BusinessHours = {
  dayOfWeek: string | string[];
  opens: string;
  closes: string;
};

export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  initial: string;
};

export type TrustBadge = {
  icon: string;
  text: string;
};

export type ClientConfig = {
  // ── Identity ──────────────────────────────────────────────────────────────
  companyName: string;
  companyShortName: string;
  proPortalName: string;
  tagline: string;
  subTagline: string;
  foundedYear: number;
  industryType: "marine" | "automotive" | "aircraft" | "general";

  // ── Contact ───────────────────────────────────────────────────────────────
  phone: string;
  phoneE164: string;
  email: string;
  city: string;
  state: string;
  serviceArea: string;

  // ── URLs ──────────────────────────────────────────────────────────────────
  siteUrl: string;
  crmUrl: string;

  // ── Brand assets (paths relative to /public) ──────────────────────────────
  logoWhiteSvg: string;
  logoFullWhitePng: string;
  logoFullBlackSvg: string;
  ogImagePath: string;
  faviconPath: string;

  // ── Colors ────────────────────────────────────────────────────────────────
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
  };

  // ── SEO ───────────────────────────────────────────────────────────────────
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  localBusinessType: string;

  // ── Geo (for JSON-LD and Google Places) ───────────────────────────────────
  geo: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };

  // ── Business hours ────────────────────────────────────────────────────────
  businessHours: BusinessHours[];

  // ── Social profiles ───────────────────────────────────────────────────────
  socials: SocialLink[];

  // ── JSON-LD sameAs URLs ───────────────────────────────────────────────────
  sameAs: string[];

  // ── Services (drives QuoteForm, services page, home grid, JSON-LD) ────────
  services: ServiceItem[];

  // ── Asset types shown in QuoteForm (replaces marine "vesselTypes") ─────────
  assetTypes: string[];

  // ── Trust bar badges on the home page ─────────────────────────────────────
  trustBadges: TrustBadge[];

  // ── Team members for the About page ───────────────────────────────────────
  team: TeamMember[];

  // ── Copy overrides ────────────────────────────────────────────────────────
  ctaText: string;
  ctaSubtext: string;
  footerTagline: string;
  waiverTitle: string;

  // ── Legal ─────────────────────────────────────────────────────────────────
  privacyEffectiveDate: string;

  // ── Integrations (toggle per client) ──────────────────────────────────────
  integrations: {
    googleAnalytics: boolean;
    googleAds: boolean;
    googleAdsConversionId?: string;
    googlePlaces: boolean;
    quickbooks: boolean;
    dialpad: boolean;
    googleCalendar: boolean;
    googleDrive: boolean;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// NorthWake Marine — reference implementation
// ─────────────────────────────────────────────────────────────────────────────
export const clientConfig: ClientConfig = {
  companyName: "NorthWake Marine",
  companyShortName: "NorthWake",
  proPortalName: "NorthWake Pro",
  tagline: "From Dock to Destination",
  subTagline: "Your Yacht Is Our Priority",
  foundedYear: 2025,
  industryType: "marine",

  phone: "(904) 606-5454",
  phoneE164: "+19046065454",
  email: "info@northwakemarine.com",
  city: "Jacksonville",
  state: "FL",
  serviceArea: "St. Johns River Corridor & Surrounding Areas",

  siteUrl: "https://www.northwakemarine.com",
  crmUrl: "https://www.northwakemarine.com/pro",

  logoWhiteSvg: "/brand/nwmlogowhite.svg",
  logoFullWhitePng: "/brand/nwmlogofullwhite.png",
  logoFullBlackSvg: "/brand/nwmlogofullblack.svg",
  ogImagePath: "/og-image.png",
  faviconPath: "/favicon.png",

  colors: {
    primary: "#000080",
    primaryLight: "#5050ff",
    primaryDark: "#1a1aaa",
    accent: "#ffffff",
  },

  seoTitle: "NorthWake Marine | Premium Boat Detailing & Vessel Management: Jacksonville, FL",
  seoDescription:
    "Jacksonville's premier marine services company. Expert ceramic coating, monthly boat maintenance, and full-service yacht management on the St. Johns River and beyond.",
  seoKeywords: [
    "boat detailing Jacksonville FL",
    "ceramic coating marine Jacksonville",
    "yacht management Jacksonville",
    "vessel maintenance Florida",
    "boat cleaning Jacksonville",
    "marine services St Johns River",
    "NorthWake Marine",
  ],
  localBusinessType: "LocalBusiness",

  geo: {
    latitude: 30.3322,
    longitude: -81.6557,
    radiusMeters: 80000,
  },

  businessHours: [
    {
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00",
    },
    {
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "14:00",
    },
  ],

  socials: [
    {
      id: "youtube",
      platform: "YouTube",
      handle: "@NorthWakeMarine",
      href: "https://www.youtube.com/@northwakemarine",
      description:
        "Watch full detailing transformations, ceramic coating time-lapses, and behind-the-scenes content from our Jacksonville marina visits.",
      cta: "Watch on YouTube",
      accent: "#ff0000",
    },
    {
      id: "instagram",
      platform: "Instagram",
      handle: "@northwakemarine",
      href: "https://www.instagram.com/northwakemarine",
      description:
        "Before-and-after photos, ceramic coating results, and daily marina life from the NorthWake team on the St. Johns River.",
      cta: "Follow on Instagram",
      accent: "#e1306c",
    },
    {
      id: "tiktok",
      platform: "TikTok",
      handle: "@northwakemarine",
      href: "https://www.tiktok.com/@northwakemarine",
      description:
        "Short-form detailing videos, product demos, and quick tips for keeping your vessel looking its best between professional services.",
      cta: "Follow on TikTok",
      accent: "#ffffff",
    },
    {
      id: "facebook",
      platform: "Facebook",
      handle: "NorthWake Marine",
      href: "https://www.facebook.com/profile.php?id=61577308802144",
      description:
        "Service announcements, client testimonials, local Jacksonville boating news, and special promotions.",
      cta: "Follow on Facebook",
      accent: "#1877f2",
    },
    {
      id: "google",
      platform: "Google Reviews",
      handle: "NorthWake Marine on Google",
      href: "https://g.page/r/CdvYJ9aDJv8NEAE/review",
      description:
        "Had a great experience with NorthWake Marine? We'd be grateful for a Google review. It helps other Jacksonville boat owners find us and know what to expect.",
      cta: "Leave a Google Review",
      accent: "#fbbc05",
    },
  ],

  sameAs: [
    "https://www.instagram.com/northwakemarine",
    "https://www.facebook.com/profile.php?id=61577308802144",
    "https://www.youtube.com/@northwakemarine",
    "https://www.tiktok.com/@northwakemarine",
    "https://g.page/r/CdvYJ9aDJv8NEAE/review",
    "https://x.com/NorthWakeMarine",
    "https://www.linkedin.com/company/northwake-marine/",
    "https://www.yelp.com/biz/northwake-marine-jacksonville",
    "https://www.mapquest.com/us/florida/northwake-marine-790166236",
    "https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResultDetail?inquirytype=EntityName&directionType=ForwardList&searchNameOrder=NORTHWAKEMARINE%20L250002625010&aggregateId=flal-l25000262501-7e8ea010-7082-4425-8ab4-ae674e60d19e&searchTerm=NORTHWALL%20BENEFIT%20HOLDINGS%2C%20INC.&listNameOrder=NORTHWAAL%20P190000412970",
  ],

  services: [
    {
      id: "yacht-management",
      icon: "◈",
      tier: "Management",
      badge: "Featured",
      title: "Yacht Management",
      tagline: "Full-Service Concierge Care",
      description:
        "Complete end-to-end management for serious yacht owners who want nothing left to chance. From crew sourcing and captain coordination to insurance compliance, provisioning, voyage planning, and haul-out scheduling, our dedicated marine professionals handle every operational detail so you can focus on enjoying the water.",
      includes: [
        "Dedicated vessel manager & single point of contact",
        "Crew sourcing, vetting & captain coordination",
        "Provisioning, fuel coordination & logistics",
        "Insurance, documentation & USCG compliance",
        "Haul-out scheduling, storage & relaunch",
        "Voyage planning & slip/anchorage reservations",
      ],
      schemaDescription:
        "Full-service yacht management in Jacksonville, FL, including crew coordination, provisioning, insurance compliance, and voyage planning.",
    },
    {
      id: "maintenance-wash",
      icon: "◇",
      tier: "Washing",
      badge: "Most Popular",
      title: "Maintenance Wash",
      tagline: "Fresh Off the Dock, Every Time",
      description:
        "Keep your vessel looking its best with our signature top-to-waterline clean that removes salt, grime, and buildup. Includes foam bath, chamois dry, and wipe-down of glass and non-skid for that fresh-off-the-dock shine, without the effort.",
      includes: [
        "Full exterior foam bath & rinse",
        "Chamois dry",
        "Glass & non-skid wipe-down",
        "Salt & grime removal",
        "Rubber & trim wipe",
        "Quick visual condition check",
      ],
      schemaDescription:
        "Signature maintenance wash for boats in Jacksonville, FL. Top-to-waterline salt and grime removal with foam bath, chamois dry, and glass wipe-down.",
    },
    {
      id: "one-off-wash",
      icon: "△",
      tier: "Washing",
      badge: null,
      title: "One-Off Washes",
      tagline: "Spotless Without Commitment",
      description:
        "Need a quick clean before a trip or a showing? Our one-off washes deliver a spotless finish without requiring a maintenance plan. Perfect for seasonal boaters or special occasions when your vessel needs to look its absolute best.",
      includes: [
        "Full exterior wash & rinse",
        "Salt & mineral deposit removal",
        "Glass & stainless wipe-down",
        "Deck & non-skid scrub",
        "Hull spot treatment",
        "Same-day availability (subject to scheduling)",
      ],
      schemaDescription:
        "One-off boat wash service in Jacksonville, FL. No commitment required, ideal for seasonal boaters and pre-trip cleanings.",
    },
    {
      id: "full-detail",
      icon: "◈",
      tier: "Detailing",
      badge: "Premium",
      title: "Full Detail",
      tagline: "Bow-to-Stern Perfection",
      description:
        "Our most comprehensive detailing service. We remove oxidation, water spots, salt deposits, and staining through a meticulous wash, clay-bar, compound, polish, and seal sequence, then finish every interior surface, stainless fitting, and non-skid panel to showroom condition.",
      includes: [
        "Full exterior wash & decontamination",
        "Clay bar paint correction",
        "Multi-stage compound & dual-action polish",
        "Marine wax or polymer sealant coat",
        "Full stainless, chrome & glass polishing",
        "Deck scrub & non-skid treatment",
        "Interior vacuum, wipe-down & sanitation",
        "Optional engine bay detailing",
      ],
      schemaDescription:
        "Full bow-to-stern boat detailing in Jacksonville, FL. Includes clay bar, multi-stage compounding, polishing, sealant, interior cleaning, and optional engine bay service.",
    },
    {
      id: "interior-detailing",
      icon: "✦",
      tier: "Detailing",
      badge: null,
      title: "Interior Cleaning & Cabin Detailing",
      tagline: "Luxury Restored, Every Surface",
      description:
        "Deep-clean and luxury restoration of every interior surface. Our marine-trained specialists condition teak, treat vinyl and fabric upholstery, polish stainless and chrome fittings, eliminate odors at the source, and sanitize cabins, heads, and galleys, leaving a new-yacht feel after every service.",
      includes: [
        "Full interior vacuum, wipe-down & sanitation",
        "Teak & teak-alternative conditioning",
        "Marine vinyl & fabric upholstery treatment",
        "Stainless & chrome polishing & protectant",
        "Odor elimination (ozone treatment available)",
        "Bilge cleaning & compartment sanitation",
      ],
      schemaDescription:
        "Comprehensive interior boat detailing and cabin cleaning in Jacksonville, FL, including teak conditioning, upholstery treatment, and odor elimination.",
    },
    {
      id: "canvas-cleaning",
      icon: "◉",
      tier: "Detailing",
      badge: null,
      title: "Canvas Cleaning & Treatment",
      tagline: "Restore Color. Repel the Elements.",
      description:
        "Deep-cleaning to remove mold, mildew, and stains from biminis, covers, and enclosures, followed by marine-grade UV and water-repellent treatment that restores original color and extends canvas life significantly.",
      includes: [
        "Mold, mildew & stain removal",
        "Marine-safe fabric deep clean",
        "UV-protective treatment application",
        "Water-repellent re-treatment",
        "Color restoration where applicable",
        "Zipper & hardware inspection",
      ],
      schemaDescription:
        "Canvas cleaning and UV treatment for boat biminis, covers, and enclosures in Jacksonville, FL. Removes mold and mildew and restores water repellency.",
    },
    {
      id: "vinyl-upholstery",
      icon: "⬖",
      tier: "Detailing",
      badge: null,
      title: "Vinyl & Upholstery Conditioning",
      tagline: "Prevent Cracking. Preserve Color.",
      description:
        "UV-protective cleaning and conditioning for seats, cushions, and all upholstery surfaces to prevent premature cracking and fading. We use marine-specific products that clean deep, restore suppleness, and leave a UV barrier that protects in Jacksonville's intense sun.",
      includes: [
        "Marine vinyl deep clean",
        "UV-protective conditioner application",
        "Stain treatment & removal",
        "Seam & stitching inspection",
        "Fabric upholstery treatment available",
        "Color restoration where possible",
      ],
      schemaDescription:
        "Marine vinyl and upholstery cleaning and UV conditioning for boats in Jacksonville, FL. Prevents cracking, fading, and UV damage.",
    },
    {
      id: "teak-cleaning",
      icon: "◇",
      tier: "Detailing",
      badge: null,
      title: "Teak Cleaning & Brightening",
      tagline: "Restore the Natural Beauty of Wood",
      description:
        "Two-part teak clean and brighten to remove stains, graying, and oxidation while restoring the natural golden color of teak decks and trim. Our process is gentle on the wood but tough on grime, extending the life of your teak significantly.",
      includes: [
        "Two-part teak cleaner application",
        "Deep scrub & stain removal",
        "Brightener application & rinse",
        "Natural color restoration",
        "Optional teak sealer application",
        "Caulking condition inspection",
      ],
      schemaDescription:
        "Professional teak cleaning and brightening for boat decks and trim in Jacksonville, FL. Two-part process restores natural wood color and removes graying.",
    },
    {
      id: "stainless-polish",
      icon: "△",
      tier: "Detailing",
      badge: null,
      title: "Stainless Polish",
      tagline: "Corrosion-Free. Mirror Shine.",
      description:
        "Hand-polishing for rails, hardware, cleats, and all stainless fittings to remove corrosion, rust staining, and water spots. Finished with a marine-grade protectant that leaves a brilliant shine and guards against the harsh marine environment.",
      includes: [
        "Full stainless inventory assessment",
        "Corrosion & rust stain removal",
        "Hand-polish with marine compounds",
        "Mirror finish buffing",
        "Marine-grade protectant application",
        "Hardware & cleat inspection",
      ],
      schemaDescription:
        "Stainless steel polishing and corrosion removal for boat rails, hardware, and fittings in Jacksonville, FL.",
    },
    {
      id: "engine-bilge",
      icon: "⬡",
      tier: "Detailing",
      badge: null,
      title: "Engine Bay & Bilge Cleaning",
      tagline: "Clean Below Decks. Spot Problems Early.",
      description:
        "Removal of grease, oil, and grime buildup from engine compartments and bilge areas using marine-safe degreasers. A clean engine bay improves appearance, makes maintenance easier, and helps you spot leaks, corrosion, or developing issues before they become costly repairs.",
      includes: [
        "Marine-safe degreaser application",
        "Engine bay scrub & rinse",
        "Bilge pump area cleaning",
        "Hose, fitting & wiring visual inspection",
        "Oil & fuel residue removal",
        "Before & after documentation",
      ],
      schemaDescription:
        "Engine bay and bilge cleaning for boats in Jacksonville, FL using marine-safe degreasers. Removes grease and oil buildup and helps identify developing issues.",
    },
    {
      id: "water-spots",
      icon: "◉",
      tier: "Detailing",
      badge: null,
      title: "Water Spot & Mineral Deposit Removal",
      tagline: "Streak-Free Glass. Spotless Surfaces.",
      description:
        "Specialized marine-safe removers and polishes eliminate hard water stains and calcium deposits from glass, stainless, and painted surfaces. Whether from dock hose drip or salt spray, we leave every surface spotless and streak-free.",
      includes: [
        "Mineral deposit analysis & treatment selection",
        "Marine-safe acid-free removers",
        "Glass, stainless & paint treatment",
        "Polish & sealant finish",
        "Window track & frame cleaning",
        "Streak-free final inspection",
      ],
      schemaDescription:
        "Water spot and mineral deposit removal for boat glass, stainless, and painted surfaces in Jacksonville, FL.",
    },
    {
      id: "ceramic-coating",
      icon: "◈",
      tier: "Protection",
      badge: "Premium",
      title: "Ceramic Coating",
      tagline: "Armor-Grade Hull Protection",
      description:
        "Professional-grade 9H nano-ceramic coating bonds permanently to your hull, gelcoat, and topside surfaces at a molecular level. The result is a hydrophobic, UV-resistant, self-cleaning barrier that repels salt, fuel stains, and marine growth for up to five years, with a mirror finish that no wax can match.",
      includes: [
        "Full paint correction prep (compound & polish)",
        "Surface decontamination & IPA wipe-down",
        "9H professional nano-ceramic application",
        "Infrared cure & hardness verification",
        "UV & salt-water resistance, up to 5 years",
        "Transferable protection warranty",
      ],
      schemaDescription:
        "Professional 9H nano-ceramic coating application for boats and yachts in Jacksonville, FL. Provides up to 5 years of UV and salt-water protection with a mirror-grade finish.",
    },
    {
      id: "wax-application",
      icon: "◇",
      tier: "Protection",
      badge: null,
      title: "Wax Application",
      tagline: "High-Gloss Protection That Lasts",
      description:
        "Polymer or carnauba-based marine waxes that shield gelcoat and paint from UV radiation, salt, and oxidation. A professionally applied wax delivers a durable, high-gloss finish that lasts for months, and serves as an excellent maintenance layer between ceramic coating services.",
      includes: [
        "Surface prep wash & light polish",
        "Polymer or carnauba wax selection",
        "Machine-applied even coat",
        "Hand-buff to high-gloss finish",
        "UV & salt oxidation barrier",
        "3 to 6 month protection layer",
      ],
      schemaDescription:
        "Professional marine wax application for boats in Jacksonville, FL. Polymer or carnauba-based wax for UV and salt protection with a high-gloss finish.",
    },
    {
      id: "gel-coat-restoration",
      icon: "⬖",
      tier: "Restoration",
      badge: null,
      title: "Gel Coat Restoration",
      tagline: "Eliminate Oxidation. Restore Brilliance.",
      description:
        "Years of UV exposure and salt air leave gelcoat chalky, faded, and dull. Our multi-stage restoration process, wet-sanding, compounding, machine polishing, and sealing, reverses that damage and returns your hull to a factory gloss. We finish with either a professional polymer seal or a full ceramic topper for long-term protection.",
      includes: [
        "Color depth & condition assessment",
        "Wet-sand (where required) to remove deep oxidation",
        "Multi-stage compound & machine polish",
        "High-speed rotary finishing pass",
        "Polymer sealant or ceramic topper finish",
        "Topsides trim & hardware polish",
      ],
      schemaDescription:
        "Gel coat oxidation removal and restoration service for boats in Jacksonville, FL. Multi-stage compounding and polishing returns hulls to factory gloss.",
    },
    {
      id: "marine-transport",
      icon: "△",
      tier: "Transport",
      badge: null,
      title: "Marine Transport",
      tagline: "Safe, Reliable. On Schedule.",
      description:
        "Safe, reliable vessel transport across Florida and beyond, moving slips, hauling for service, or relocating. Whether you're moving a vessel across the bay or across the state, our licensed team provides experienced coordination and protection in transit.",
      includes: [
        "Licensed & insured transport team",
        "Local Jacksonville bay moves",
        "Statewide Florida transport",
        "Haul-out & launch coordination",
        "In-transit protection & documentation",
        "Flexible scheduling & route planning",
      ],
      schemaDescription:
        "Licensed marine transport and vessel relocation services in Jacksonville, FL and across Florida. Includes haul-out coordination and in-transit protection.",
    },
    {
      id: "captain-crew",
      icon: "◉",
      tier: "Transport",
      badge: null,
      title: "Captain & Crew Services",
      tagline: "Experienced Professionals, On Demand",
      description:
        "Qualified captains, deckhands, and crew available on a day-rate or contract basis. Whether you need help moving a vessel, running a charter, delivery captaining, or simply want extra experienced hands onboard, we provide reliable, licensed marine professionals.",
      includes: [
        "USCG-licensed captains",
        "Day-rate & contract crew",
        "Delivery captaining (local & coastal)",
        "Charter support crew",
        "New vessel pickup & relocation",
        "On-call scheduling available",
      ],
      schemaDescription:
        "Captain and crew services in Jacksonville, FL. USCG-licensed captains and experienced crew available for charters, deliveries, and vessel relocations.",
    },
    {
      id: "custom-requests",
      icon: "✦",
      tier: "Custom",
      badge: null,
      title: "Custom Requests",
      tagline: "If You Can Describe It, We Can Handle It",
      description:
        "Don't see exactly what you need? We thrive on the unique and unexpected. From sourcing obscure parts and custom accessories to coordinating haul-outs, assisting with insurance inspections, pre-sale enhancements, or any other marine task, tell us what you need and we'll make it happen.",
      includes: [
        "Service customization",
        "Pre-sale preparation & detailing",
        "Insurance inspection coordination",
        "Parts sourcing & accessory installation",
        "Haul-out & winterization assistance",
        "Any service combination or special request",
      ],
      schemaDescription:
        "Custom and marine services in Jacksonville, FL. From pre-sale prep to parts sourcing and insurance inspections, if you need it, we handle it.",
    },
  ],

  assetTypes: [
    "Center Console",
    "Bowrider",
    "Pontoon",
    "Sailboat",
    "Cabin Cruiser",
    "Sport Yacht",
    "Catamaran",
    "Deck Boat",
    "Jet Boat",
    "PWC / Jet Ski",
    "Commercial Vessel",
    "Other",
  ],

  trustBadges: [
    { icon: "◈", text: "Professional-Grade Products Only" },
    { icon: "◉", text: "Photo Documentation on Every Job" },
    { icon: "◈", text: "No Obligation. No Contracts." },
    { icon: "★", text: "5-Star Rated Service" },
    { icon: "△", text: "Serving Jacksonville Since 2025" },
  ],

  team: [
    {
      name: "Alexander S.",
      role: "Co-Founder & Development",
      bio: "A licensed captain with firsthand knowledge of what boat owners actually need on the water, Alexander shapes the direction NorthWake grows. He leads strategy, client partnerships, and the business side of building something worth being proud of.",
      initial: "A",
    },
    {
      name: "Ian W.",
      role: "Co-Founder & Operations",
      bio: "NorthWake started as a shared vision between close friends who wanted to build something real together. Ian brings an engineering and technical mindset to everything the company touches, from how services are structured to the precision behind every job on the water.",
      initial: "I",
    },
  ],

  ctaText: "Get a Free Quote",
  ctaSubtext: "No obligation. Most quotes returned same day.",
  footerTagline: "Premium Marine Services · Jacksonville, FL",
  waiverTitle: "NORTHWAKE MARINE - LIABILITY WAIVER",

  privacyEffectiveDate: "April 27, 2025",

  integrations: {
    googleAnalytics: true,
    googleAds: true,
    googleAdsConversionId: "AW-17918867353",
    googlePlaces: true,
    quickbooks: true,
    dialpad: true,
    googleCalendar: true,
    googleDrive: true,
  },
};
