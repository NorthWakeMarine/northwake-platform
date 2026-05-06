import type { MetadataRoute } from "next";

const BASE = "https://northwakemarine.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      // Primary: homepage — CMS-driven hero content can change
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      // Primary: main commercial page, all 16 services listed here
      url: `${BASE}/services`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      // Primary: the conversion endpoint — quote form + FAQ
      url: `${BASE}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1.0,
    },
    {
      // Section hub: company story, team, brand values
      url: `${BASE}/about`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      // Individual component: static links to social profiles
      url: `${BASE}/socials`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.6,
    },
  ];
}
