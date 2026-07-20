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
    description: "Management, washing & detailing for the water",
    serviceIds: ["yacht-management", "maintenance-wash", "full-detail"],
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

export default function ServiceCategories({ services }: { services: ServiceItem[] }) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-px bg-gray-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-200">
        {CATEGORIES.map((cat) => {
          const isOpen = openCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenCategory(isOpen ? null : cat.id)}
              className={`group bg-white p-6 flex flex-col items-center text-center gap-2 transition-colors duration-300 ${
                isOpen ? "bg-gray-50" : "hover:bg-gray-50"
              }`}
            >
              <span
                aria-hidden="true"
                className="chrome-text-dark text-3xl leading-none transition-transform duration-300 group-hover:scale-110"
              >
                {cat.icon}
              </span>
              <h3 className="text-gray-900 text-lg sm:text-xl font-bold tracking-tight uppercase">
                {cat.label}
              </h3>
              <p className="text-gray-500 text-xs tracking-wide">{cat.description}</p>
              <span
                aria-hidden="true"
                className={`text-navy text-xs mt-1 transition-transform duration-300 ${
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
          <div key={cat.id} className="bg-white p-5 flex flex-col gap-5">
            <ul
              className={`grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200 list-none ${
                catServices.length >= 3 ? "lg:grid-cols-3" : ""
              }`}
              role="list"
            >
              {catServices.map((svc) => (
                <li
                  key={svc.id}
                  className="group bg-white p-5 flex flex-col gap-3 hover:bg-gray-50 transition-colors duration-300"
                >
                  <span
                    aria-hidden="true"
                    className="chrome-text-dark text-2xl leading-none transition-transform duration-300 group-hover:scale-110 origin-left"
                  >
                    {svc.icon}
                  </span>
                  <div>
                    <p className="text-gray-500 text-xs tracking-[0.35em] uppercase mb-0.5 transition-colors duration-200 group-hover:text-gray-700">
                      {svc.tagline}
                    </p>
                    <h4 className="text-gray-900 text-base font-bold tracking-tight transition-colors duration-200 group-hover:text-navy">
                      {svc.title}
                    </h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{svc.description}</p>
                  <ul className="flex flex-col gap-1 mt-auto list-none">
                    {svc.includes.slice(0, 3).map((d) => (
                      <li key={d} className="flex items-start gap-2 text-gray-500 text-xs">
                        <span aria-hidden="true" className="text-navy mt-0.5 transition-transform duration-200 group-hover:translate-x-0.5">
                          ▸
                        </span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            {cat.id === "yacht" && (
              <Link
                href="/services"
                className="self-center border border-gray-500 text-gray-700 text-xs font-semibold tracking-[0.3em] uppercase px-8 py-3 hover:border-navy hover:text-navy transition-colors duration-300"
              >
                See More
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
