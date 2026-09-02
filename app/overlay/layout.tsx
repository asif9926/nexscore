// app/overlay/layout.tsx
import type { Metadata } from "next";
import { ReactNode } from "react";
import OverlayThemeGuard from "@/components/overlay/OverlayThemeGuard";

// 🚫 OBS Studio Browser Source-এর ক্যাশিং পুরোপুরি বন্ধ করার হেড সার্বিক মেটাডাটা
export const metadata: Metadata = {
  title: "NexScore TV Overlay Engine",
  robots: { index: false, follow: false },
  other: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
};

export default function OverlayLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* 🛡️ OBS Studio-এর জন্য 100% হার্ডকোডেড ট্রান্সপারেন্সি লক */}
      <style>{`
        html, body {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      `}</style>
      <div className="obs-overlay-root min-h-screen w-screen bg-transparent overflow-hidden">
        <OverlayThemeGuard>{children}</OverlayThemeGuard>
      </div>
    </>
  );
}