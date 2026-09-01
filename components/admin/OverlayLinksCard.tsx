// components/admin/OverlayLinksCard.tsx
"use client";

import { useState } from "react";
import { Link2, Copy, Check, ExternalLink, Sparkles } from "lucide-react";

interface Props {
  matchId: string;
  sport?: "cricket" | "football";
  theme?: string;
}

export default function OverlayLinksCard({ matchId, sport = "cricket", theme }: Props) {
  const [copied, setCopied] = useState(false);

  const defaultTheme = sport === "football" ? "premier" : "sky";
  const activeTheme = theme || defaultTheme;

  // 🎯 নির্দিষ্ট ম্যাচ আইডি যুক্ত ডায়নামিক ওবিএস রুট
  const path = `/overlay/${sport}/${matchId}`;
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-panel p-4 shadow-xl sm:p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-fg-faint">
          <Link2 size={14} className="text-electric" /> OBS Overlay Link ({sport.toUpperCase()})
        </h3>
        <span className="flex items-center gap-1 rounded-md border border-electric/30 bg-electric/10 px-2 py-0.5 font-mono text-[10px] font-bold text-electric">
          <Sparkles size={11} className="text-signal-gold" /> THEME: {activeTheme.toUpperCase()}
        </span>
      </div>
      <p className="mb-3 text-xs text-fg-muted">
        OBS Studio-র Browser Source-এ এই লিংকটি অ্যাড করুন। এটি শুধুমাত্র এই ম্যাচের জন্য নির্দিষ্ট।
      </p>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-ink p-3">
        <code className="flex-1 truncate font-mono text-xs font-bold text-electric">{fullUrl}</code>
        <button
          onClick={handleCopy}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            copied
              ? "border-pitch-green/40 bg-pitch-green/20 text-pitch-green"
              : "border-border bg-panel-raised text-fg-muted hover:text-fg"
          }`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied!" : "Copy"}
        </button>
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1.5 text-fg-faint transition-colors hover:text-fg"
          title="প্রিভিউ দেখুন"
        >
          <ExternalLink size={15} />
        </a>
      </div>
    </div>
  );
}