"use client";

import { useState } from "react";
import Link from "next/link";
import type { ServiceItem } from "@/config/client";

type Category = {
  id: string;
  label: string;
  icon: string;
  description: string;
  serviceIds: string[];
};

const CATEGORIES: Category[] = [
  {
    id: "yacht",
    label: "Yacht",
    icon: "◈",
    description: "Management, washing, detailing & protection for the water",
    serviceIds: [
      "yacht-management",
      "maintenance-wash",
      "marine-transport",
      "full-detail",
      "outboard-engine-service",
      "ceramic-coating",
      "captain-crew",
      "outboard-diagnostics",
      "vinyl-upholstery",
      "teak-cleaning",
      "stainless-polish",
      "engine-bilge",
      "water-spots",
      "one-off-wash",
      "wax-application",
      "gel-coat-restoration",
      "interior-detailing",
      "canvas-cleaning",
      "custom-requests",
    ],
  },
  {
    id: "aviation",
    label: "Aviation",
    icon: "✦",
    description: "Hangar-side care for every aircraft",
    serviceIds: ["aero-detailing"],
  },
  {
    id: "rv-auto",
    label: "RV & Auto",
    icon: "◉",
    description: "Mobile detailing that comes to you",
    serviceIds: ["rv-detailing", "automotive-detailing"],
  },
];

export default function ServicePageCategories({ services }: { services: ServiceItem[] }) {
  const [openCategory, setOpenCategory] = useState<string | null>("yacht");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const isOpen = openCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenCategory(isOpen ? null : cat.id)}
              className={`group rounded-2xl border p-6 flex flex-col items-center text-center gap-2 transition-colors duration-300 ${
                isOpen
                  ? "border-navy bg-navy-dark"
                  : "border-steel-dark bg-obsidian hover:border-navy"
              }`}
            >
              <span
                aria-hidden="true"
                className="chrome-text text-3xl leading-none transition-transform duration-300 group-hover:scale-110"
              >
                {cat.icon}
              </span>
              <h3 className="text-wake text-lg sm:text-xl font-bold tracking-tight uppercase">
                {cat.label}
              </h3>
              <p className="text-steel text-xs tracking-wide">{cat.description}</p>
              <span
                aria-hidden="true"
                className={`text-navy-light text-xs mt-1 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>
          );
        })}
      </div>

      {CATEGORIES.map((cat) => {
        if (openCategory !== cat.id) return null;
        const catServices = cat.serviceIds
          .map((id) => services.find((s) => s.id === id))
          .filter((s): s is ServiceItem => Boolean(s));

        return (
          <ul key={cat.id} className="grid grid-cols-1 lg:grid-cols-2 gap-5 list-none" role="list">
            {catServices.map((svc) => (
              <li
                key={svc.id}
                id={svc.id}
                className="group flex flex-col rounded-2xl overflow-hidden border border-steel-dark bg-obsidian hover:border-navy transition-colors duration-300"
              >
                {/* Card header */}
                <div className="flex flex-col gap-4 p-7 border-b border-steel-dark group-hover:bg-navy-dark transition-colors duration-300">
                  <div className="flex items-start justify-between gap-3">
                    <span aria-hidden="true" className="chrome-text text-3xl leading-none transition-transform duration-300 group-hover:scale-110 origin-left">
                      {svc.icon}
                    </span>
                    {svc.badge && (
                      <span className="badge-chrome text-xs font-bold tracking-[0.2em] uppercase px-2.5 py-1">
                        <span className="badge-chrome-text">{svc.badge}</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-steel text-xs tracking-[0.35em] uppercase mb-1.5">
                      {svc.tier}
                    </p>
                    <h3 className="text-wake text-xl font-bold tracking-tight leading-tight">
                      {svc.title}
                    </h3>
                    <p className="text-steel text-xs mt-1 tracking-wide">{svc.tagline}</p>
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-col gap-5 p-7 flex-1">
                  <p className="text-steel-light text-sm leading-relaxed">{svc.description}</p>
                  <div>
                    <p className="text-steel text-xs tracking-[0.3em] uppercase mb-3">
                      What&apos;s Included
                    </p>
                    <ul className="grid grid-cols-2 gap-x-6 gap-y-2 list-none">
                      {svc.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-steel-light text-xs">
                          <span aria-hidden="true" className="text-navy mt-0.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">▸</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-7 pb-7 flex items-center gap-4">
                  <Link
                    href={`/contact?service=${encodeURIComponent(svc.title)}`}
                    aria-label={`Request service: ${svc.title}`}
                    className="chrome-btn inline-block text-xs font-bold tracking-[0.25em] uppercase px-5 py-2.5 transition-all duration-300 hover:scale-105"
                  >
                    Request Service
                  </Link>
                  <Link
                    href={`/services/${svc.id}`}
                    aria-label={`Learn more about ${svc.title}`}
                    className="text-xs font-semibold tracking-[0.2em] uppercase text-steel hover:text-wake transition-colors border-b border-steel-dark hover:border-wake pb-0.5"
                  >
                    Learn More
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}
