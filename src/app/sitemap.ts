import type { MetadataRoute } from "next";
import { clientConfig } from "@/config/client";

const BASE = clientConfig.siteUrl;
const UPDATED = new Date("2026-06-21");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE,
      lastModified: UPDATED,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE}/services`,
      lastModified: UPDATED,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE}/contact`,
      lastModified: UPDATED,
      changeFrequency: "yearly",
      priority: 1.0,
    },
    {
      url: `${BASE}/about`,
      lastModified: UPDATED,
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: `${BASE}/socials`,
      lastModified: UPDATED,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    ...clientConfig.services.map((svc) => ({
      url: `${BASE}/services/${svc.id}`,
      lastModified: UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...clientConfig.locations.map((loc) => ({
      url: `${BASE}/locations/${loc.slug}`,
      lastModified: UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
