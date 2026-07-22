import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Tüm https domainlerine izin ver
      },
    ],
  },
};

export default nextConfig;