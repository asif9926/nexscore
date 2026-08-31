import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🔒 firebase-admin এবং এর ডিপেন্ডেন্সিকে সার্ভারলেস বান্ডলার থেকে বাদ দিয়ে সরাসরি Node.js এ রান করাবে
  serverExternalPackages: ["firebase-admin"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;