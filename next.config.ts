import type { NextConfig } from "next";

// Auto-detect the base URL: explicit NEXTAUTH_URL > Vercel deployment URL > localhost
const baseUrl =
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const nextConfig: NextConfig = {
  env: {
    NEXTAUTH_URL: baseUrl,
  },
  async headers() {
    return [
      {
        source: "/api/auth/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
