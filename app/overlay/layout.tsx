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
  return <OverlayThemeGuard>{children}</OverlayThemeGuard>;
}