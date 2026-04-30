import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    qualities: [75, 90, 100],
  },

  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/services.html", destination: "/services", permanent: true },
      { source: "/about-us.html", destination: "/about", permanent: true },
      { source: "/Contact-Us", destination: "/contact", permanent: true },
      { source: "/:path*.php", destination: "/", permanent: true },
      { source: "/:path*.asp", destination: "/", permanent: true },
    ];
  },

  // Prevent the /pro route from appearing in search engines at the config level
  async headers() {
    return [
      {
        source: "/pro/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control",  value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
