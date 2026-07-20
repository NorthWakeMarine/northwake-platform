"use client";

import { useState } from "react";
import Link from "next/link";
import { clientConfig } from "@/config/client";

const MARINAS = [
  "Port 32 Jax",
  "Queens Harbour Yacht and Country Club",
  "The Florida Yacht Club",
  "Ortega Yacht Club",
  "The Rudder Club",
  "Rod-N-Gun Club",
  "Harbortown Marina",
  "Marina San Pablo",
  "Mariners Pointe",
  "Arlington Marina",
  "Berkman Plaza Marina",
  "Yacht Harbor Marina",
  "River City Marina",
  "Venetian Marina",
  "Cedar River Marina",
  "Light House Marina",
  "Cats Paw Marina",
  "Seafarers Marina",
  "Bill Dye Marina",
  "Bulls Bay Marina",
  "Mandarin Holiday Marina",
  "Julington Creek Marina",
  "Julington Creek Pier 3",
  "Doctors Lake Marina",
  "Black Creek Marina",
  "Palm Cove Marina",
  "English Landing Marina",
  "Queens Harbor Marina",
  "Camachee Cove",
  "Marsh Landing Marina",
  "Hidden Harbor Marina",
  "San Sebastian Marina",
  "Beaches Marina Vilano",
  "Villages of Vilano Marina",
  "The Conch House Marina",
  "St. Augustine Municipal Marina",
  "St. Augustine Marine Center",
  "Oasis Boatyard",
  "Fish Island Marina",
  "Rivers Edge Marina",
  "Palm Coast Marina",
  "Hammock Dunes Club",
  "Huckins Yacht Corporation",
  "Lamb's Yacht Center",
  "Jacksonville Shipyard",
  "Marina at Ortega Landing",
  "Winward at Ortega River Marina",
  "Winward at Beach Marine",
  "Fernandina Beach Marina",
  "Amelia Island Yacht Basin",
  "The Bight Marina",
  "Green Cove Springs Municipal Marina",
  "Tiger Point Marina",
];

const WATERWAYS = [
  "St. Johns River",
  "Ortega River",
  "Trout River",
  "Ribault River",
  "Intercoastal Waterway",
  "Julington Creek",
  "Governors Creek",
  "Sisters Creek",
  "Browns Creek",
  "Mills Creek",
  "Pottsburg Creek",
  "Goodby's Creek",
  "Christopher Creek",
  "Durbin Creek",
  "Cedar River",
  "Black Creek",
  "Doctors Lake",
  "Amelia River",
  "Nassau River",
  "Nassau Sound",
  "Lofton Creek",
  "Egans Creek",
  "Blount Island",
  "Fort George Island",
  "Mayport Jetties",
  "Mill Cove",
  "Plumbers Cove",
  "Pineapple Point",
  "Racine Point",
  "Bayard Point",
];

const COMMUNITIES = [
  "Jacksonville",
  "Mandarin",
  "Avondale",
  "Ortega",
  "San Marco",
  "Southside",
  "Fort Caroline",
  "Palm Valley",
  "Fruit Cove",
  "Orangedale",
  "St. Johns",
  "Jacksonville Beach",
  "Atlantic Beach",
  "Neptune Beach",
  "Ponte Vedra",
  "Mayport",
  "Orange Park",
  "Green Cove Springs",
  "St. Augustine",
  "Amelia Island",
  "Fernandina Beach",
  "Palm Coast",
];

export default function CoverageList() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center gap-2 border border-gray-500 text-gray-700 text-xs font-semibold tracking-[0.25em] uppercase px-6 py-3 hover:border-navy hover:text-navy transition-colors duration-300"
      >
        {expanded ? "Hide Full Coverage List" : "View Full Coverage List"}
        <span aria-hidden="true" className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}>▾</span>
      </button>

      {expanded && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
          <div>
            <p className="text-gray-500 text-xs tracking-[0.3em] uppercase mb-4 border-b border-gray-200 pb-2">
              Marinas &amp; Facilities
            </p>
            <ul className="columns-2 gap-x-6 list-none space-y-1.5">
              {MARINAS.map((name) => (
                <li key={name} className="text-gray-600 text-xs leading-snug break-inside-avoid">
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-gray-500 text-xs tracking-[0.3em] uppercase mb-4 border-b border-gray-200 pb-2">
              Waterways &amp; Inlets
            </p>
            <ul className="columns-2 gap-x-6 list-none space-y-1.5">
              {WATERWAYS.map((name) => (
                <li key={name} className="text-gray-600 text-xs leading-snug break-inside-avoid">
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-gray-500 text-xs tracking-[0.3em] uppercase mb-4 border-b border-gray-200 pb-2">
              Communities &amp; Neighborhoods
            </p>
            <ul className="columns-2 gap-x-6 list-none space-y-1.5">
              {COMMUNITIES.map((name) => (
                <li key={name} className="text-gray-600 text-xs leading-snug break-inside-avoid">
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-gray-500 text-xs tracking-[0.3em] uppercase mb-4 border-b border-gray-200 pb-2">
              Airports
            </p>
            <ul className="list-none space-y-1.5">
              {clientConfig.airports.map((airport) => (
                <li key={airport.slug} className="text-xs leading-snug">
                  <Link
                    href={`/airports/${airport.slug}`}
                    className="text-gray-600 hover:text-navy transition-colors duration-200"
                  >
                    {airport.name} ({airport.icao})
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
