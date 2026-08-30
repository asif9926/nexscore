import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Anton, Rajdhani } from "next/font/google";
import { MatchDataProvider } from "@/lib/context/MatchDataContext";
import { ToastProvider } from "@/lib/context/ToastContext";
import "./globals.css";

// UI / body role — see NexScore-Design-System.md §1.2
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Scoreboard role — the signature typeface, used only for live score digits
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

// Broadcast-label role — LIVE badges, half/over labels, timers
const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.startsWith("http")
      ? process.env.NEXT_PUBLIC_SITE_URL
      : `https://${process.env.NEXT_PUBLIC_SITE_URL}`;
  }
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
};

const siteUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "NexScore — Live Sports Broadcasting & Scoring",
  description: "Real-time cricket & football scoring with OBS-ready broadcast overlays.",
  keywords: ["cricket scoring", "football scoring", "live sports broadcast", "OBS overlay", "live scoreboard"],
};

export const viewport: Viewport = {
  // Matches --ink from the design system, not the old slate #020617
  themeColor: "#06080F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${anton.variable} ${rajdhani.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col w-full max-w-full overflow-x-clip">
        <ToastProvider>
          <MatchDataProvider>{children}</MatchDataProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
