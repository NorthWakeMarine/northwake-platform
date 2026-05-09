import type { MetadataRoute } from "next";
import { clientConfig } from "@/config/client";

const BASE = clientConfig.siteUrl;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE,
      lastModified: new Date("2025-05-01"),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE}/services`,
      lastModified: new Date("2025-05-01"),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE}/contact`,
      lastModified: new Date("2025-05-01"),
      changeFrequency: "yearly",
      priority: 1.0,
    },
    {
      url: `${BASE}/about`,
      lastModified: new Date("2025-05-01"),
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: `${BASE}/socials`,
      lastModified: new Date("2025-05-01"),
      changeFrequency: "yearly",
      priority: 0.6,
    },
  ];
}
