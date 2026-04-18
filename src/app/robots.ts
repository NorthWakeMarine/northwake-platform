import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow all crawlers full access to the landing site
        userAgent: "*",
        allow: "/",
        disallow: ["/pro", "/pro/"],
      },
      // Explicitly block known AI training crawlers
      { userAgent: "GPTBot",          disallow: ["/"] },
      { userAgent: "ChatGPT-User",    disallow: ["/"] },
      { userAgent: "Google-Extended", disallow: ["/"] },
      { userAgent: "CCBot",           disallow: ["/"] },
      { userAgent: "anthropic-ai",    disallow: ["/"] },
      { userAgent: "Claude-Web",      disallow: ["/"] },
      { userAgent: "Omgilibot",       disallow: ["/"] },
      { userAgent: "FacebookBot",     disallow: ["/"] },
      { userAgent: "Bytespider",      disallow: ["/"] },
      { userAgent: "PetalBot",        disallow: ["/"] },
      { userAgent: "YouBot",          disallow: ["/"] },
    ],
    sitemap: "https://northwakemarine.com/sitemap.xml",
  };
}
