// app/overlay/layout.tsx
import { ReactNode } from "react";

export default function OverlayLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-transparent overflow-hidden font-sans">
      {/* OBS এবং ব্রাউজারের জন্য body ও html ব্যাকগ্রাউন্ড পুরোপুরি ট্রান্সপারেন্ট করা হলো */}
      <style>{`
        html, body {
          background-color: transparent !important;
          background: transparent !important;
          overflow: hidden !important;
        }
      `}</style>
      {children}
    </div>
  );
}