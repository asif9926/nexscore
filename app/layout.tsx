// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Anton, Rajdhani } from "next/font/google";
import { ToastProvider } from "@/lib/context/ToastContext";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

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

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: "NexScore — Live Sports Broadcasting & Scoring",
  description: "Real-time cricket & football scoring with OBS-ready broadcast overlays.",
  keywords: ["cricket scoring", "football scoring", "live sports broadcast", "OBS overlay", "live scoreboard"],
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
        {/* ☀️ ডিফল্ট লাইট মোড স্ক্রিপ্ট: প্রথমবার ভিজিট করলেই Sunlight মোড অন হবে */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                // 🛡️ OBS Overlay লিংকে কখনোই Sunlight ক্লাস যুক্ত হবে না
                if (window.location.pathname.indexOf('/overlay') !== -1) return;

                // নতুন ইউজারের ক্ষেত্রে saved হবে null, তাই ডিফল্ট হিসেবে লাইট মোড চালু হবে
                var saved = localStorage.getItem('nexscore_sunlight');
                if (saved !== 'false') {
                  document.documentElement.classList.add('sunlight');
                } else {
                  document.documentElement.classList.remove('sunlight');
                }
              } catch (e) {}
            })()`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col w-full max-w-full overflow-x-clip">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}