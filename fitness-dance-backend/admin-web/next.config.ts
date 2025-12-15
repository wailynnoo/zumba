import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For Railway deployment - use standalone for full SSR
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002",
  },
  images: {
    unoptimized: false, // Enable image optimization
    remotePatterns: [], // Add remote patterns if needed
  },
};

export default nextConfig;
