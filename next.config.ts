import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Unsplash test resimleri için
      },
      {
        protocol: "https",
        hostname: "utfs.io", // UploadThing bulut resimlerin için
      }
    ],
  },
};

export default nextConfig;