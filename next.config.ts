// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    // 🛡️ ফিক্সড: ভ্যালিড হোস্টিং প্যাটার্ন (Next.js বিল্ড ক্র্যাশ প্রতিরোধ)
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // 🛡️ OBS Studio ও ব্রডকাস্ট ব্রাউজার সোর্সের জন্য সিকিউর আইফ্রেম অ্যালাউ
  async headers() {
    return [
      {
        source: "/overlay/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "X-Frame-Options", value: "ALLOWALL" },
        ],
      },
    ];
  },
};

export default nextConfig;