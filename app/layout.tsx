// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Anton, Rajdhani } from "next/font/google";
import { MatchDataProvider } from "@/lib/context/MatchDataContext";
import { ToastProvider } from "@/lib/context/ToastContext";
import "./globals.css";

// UI / body font
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Scoreboard font
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

// Broadcast labels font
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
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${anton.variable} ${rajdhani.variable} antialiased`}
    >
      <head>
        {/* ☀️ FOUT প্রিভেনশন স্ক্রিপ্ট: পেজ পেইন্ট হওয়ার আগেই থিম ক্লাস সেট করবে */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                if (localStorage.getItem('nexscore_sunlight') === 'true') {
                  document.documentElement.classList.add('sunlight');
                }
              } catch (e) {}
            })()`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col w-full max-w-full overflow-x-clip">
        <ToastProvider>
          <MatchDataProvider>{children}</MatchDataProvider>
        </ToastProvider>
      </body>
    </html>
  );
}