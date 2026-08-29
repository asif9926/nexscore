"use client";

import { useState } from "react";
import { Link2, Copy, Check, ExternalLink } from "lucide-react";

interface Props {
  sport: "cricket" | "football";
  theme?: string;
}

export default function OverlayLinksCard({ sport, theme }: Props) {
  const [copied, setCopied] = useState(false);
  
  const defaultTheme = sport === "football" ? "premier" : "sky";
  const activeTheme = theme || defaultTheme;
  const path = `/overlay/${sport}/${activeTheme}`;
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
    <div className="rounded-2xl border border-border bg-panel p-5 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-fg-faint">
          <Link2 size={14} /> OBS Overlay Browser Link
        </h3>
        <span className="rounded-md border border-electric/30 bg-electric/10 px-2 py-0.5 font-mono text-[10px] font-bold text-electric">
          THEME: {activeTheme}
        </span>
      </div>
      <p className="mb-3 text-xs text-fg-muted">এই লিংকটি OBS Studio-র Browser Source-এ পেস্ট করুন</p>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-ink p-3">
        <code className="flex-1 truncate font-mono text-xs text-electric">{fullUrl}</code>
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
          title="নতুন ট্যাবে প্রিভিউ দেখুন"
        >
          <ExternalLink size={15} />
        </a>
      </div>
    </div>
  );
}