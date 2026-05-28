import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    // pdfkit needs its AFM font metric files at runtime on Vercel
    "/**": ["./node_modules/pdfkit/js/data/**/*"],
  },

  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    qualities: [75, 80],
    deviceSizes: [640, 750, 828, 1080, 1280],
    imageSizes: [16, 32, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/services.html", destination: "/services", permanent: true },
      { source: "/about-us.html", destination: "/about", permanent: true },
      { source: "/Contact-Us", destination: "/contact", permanent: true },
      { source: "/contact-us.html", destination: "/contact", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/:path*.php", destination: "/", permanent: true },
      { source: "/:path*.asp", destination: "/", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/pro/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
      {
        source: "/brand/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^\/(pro|api)(\/.*)?$/,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /\/(brand|images|icons)\//,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: { maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
    ],
  },
})(nextConfig);
