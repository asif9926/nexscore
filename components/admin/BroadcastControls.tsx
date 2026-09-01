// components/admin/BroadcastControls.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ref, update } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import {
  Tv,
  Award,
  User,
  Flame,
  Users2,
  ShieldAlert,
  LayoutTemplate,
  Activity,
  Upload,
  Trash2,
  FileBarChart,
  Trophy,
} from "lucide-react";
import type { BroadcastGraphicType } from "@/lib/types/match";
import { useToast } from "@/lib/context/ToastContext";

interface Props {
  sport?: "cricket" | "football";
  showScoreboard: boolean;
  showLogo: boolean;
  activeGraphic?: BroadcastGraphicType;
  activeTheme?: string;
  customLogoUrl?: string | null;
  customLogoLeftUrl?: string | null;
}

const CRICKET_THEMES = [
  { id: "sky", label: "Sky / Sony (6-Block)" },
  { id: "dark", label: "Ultra Dark (Matrix)" },
  { id: "psl", label: "PSL Cyber (Neon)" },
  { id: "fox", label: "Fox Sports (Slanted)" },
  { id: "ipl", label: "IPL Neon (Chyron)" },
  { id: "minimal", label: "Minimal Bar (Compact)" },
];

const FOOTBALL_THEMES = [
  { id: "premier", label: "Premier League" },
  { id: "ucl", label: "Champions League" },
  { id: "fifa", label: "FIFA World Cup" },
  { id: "laliga", label: "La Liga (Cyber)" },
  { id: "classic", label: "Classic Center" },
];

export default function BroadcastControls({
  sport = "cricket",
  showScoreboard,
  showLogo,
  activeGraphic = "LOWER_THIRD",
  activeTheme,
  customLogoUrl,
  customLogoLeftUrl,
}: Props) {
  const { showToast } = useToast();
  const [uploadingSide, setUploadingSide] = useState<"left" | "right" | null>(null);
  const autoRevertTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isCricket = sport === "cricket";
  const currentTheme = activeTheme || (sport === "football" ? "premier" : "sky");
  const themesList = sport === "football" ? FOOTBALL_THEMES : CRICKET_THEMES;

  useEffect(() => {
    return () => {
      if (autoRevertTimerRef.current) clearTimeout(autoRevertTimerRef.current);
    };
  }, []);

  const toggleGraphic = (graphic: BroadcastGraphicType, autoRevertMs: number = 0) => {
    if (autoRevertTimerRef.current) {
      clearTimeout(autoRevertTimerRef.current);
      autoRevertTimerRef.current = null;
    }

    if (activeGraphic === graphic) {
      update(ref(rtdb), {
        "match/meta/activeGraphic": "LOWER_THIRD",
        "match/meta/updatedAt": Date.now(),
      });
      return;
    }

    update(ref(rtdb), {
      "match/meta/activeGraphic": graphic,
      "match/meta/updatedAt": Date.now(),
    });

    if (autoRevertMs > 0) {
      autoRevertTimerRef.current = setTimeout(() => {
        update(ref(rtdb), {
          "match/meta/activeGraphic": "LOWER_THIRD",
          "match/meta/updatedAt": Date.now(),
        });
        autoRevertTimerRef.current = null;
      }, autoRevertMs);
    }
  };

  const changeTheme = (themeId: string) => {
    update(ref(rtdb), {
      "match/meta/activeTheme": themeId,
      "match/meta/updatedAt": Date.now(),
    });
  };

  const toggleVisibility = (field: "showScoreboard" | "showLogo", current: boolean) => {
    update(ref(rtdb), {
      [`match/meta/${field}`]: !current,
      "match/meta/updatedAt": Date.now(),
    });
  };

  const processImageToWebP = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 220;
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/webp", 0.85));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: "left" | "right") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingSide(side);
      const optimizedBase64 = await processImageToWebP(file);
      const field = side === "left" ? "customLogoLeftUrl" : "customLogoUrl";

      await update(ref(rtdb), {
        [`match/meta/${field}`]: optimizedBase64,
        "match/meta/updatedAt": Date.now(),
      });

      showToast(`${side === "left" ? "Left" : "Channel"} logo updated!`, "success");
    } catch {
      showToast("Failed to upload logo.", "error");
    } finally {
      setUploadingSide(null);
    }
  };

  const removeCustomLogo = (side: "left" | "right") => {
    const field = side === "left" ? "customLogoLeftUrl" : "customLogoUrl";
    update(ref(rtdb), {
      [`match/meta/${field}`]: null,
      "match/meta/updatedAt": Date.now(),
    });
    showToast(`${side === "left" ? "Left" : "Channel"} logo reset to default.`, "info");
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-panel p-4 shadow-lg sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-fg sm:text-sm">
            {isCricket ? "TV Graphics Director (PCR)" : "Football Broadcast Controls"}
          </h3>
          <p className="text-[11px] text-fg-muted">Overlay graphics, themes &amp; channel badge</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-electric/30 bg-electric/10 px-2.5 py-0.5 text-[10px] font-bold text-electric sm:px-3 sm:py-1 sm:text-xs">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-electric sm:h-2 sm:w-2" />
          <span className="max-w-[85px] truncate sm:max-w-none">{activeGraphic}</span>
        </div>
      </div>

      {/* 1. Instant Graphics Triggers */}
      {isCricket ? (
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-fg-faint">
            Instant Graphics Triggers (Auto-revert)
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <button
              onClick={() => toggleGraphic("BATSMAN_CARD", 6000)}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition-all active:scale-95 ${
                activeGraphic === "BATSMAN_CARD"
                  ? "border-electric bg-electric text-white shadow-md shadow-electric/30 scale-[1.02]"
                  : "border-electric/30 bg-electric/10 text-electric hover:bg-electric/20"
              }`}
            >
              <User size={14} />
              <span>Batter Card</span>
              {activeGraphic === "BATSMAN_CARD" && <span className="text-[9px] font-black">● ON</span>}
            </button>

            <button
              onClick={() => toggleGraphic("BOWLER_CARD", 6000)}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition-all active:scale-95 ${
                activeGraphic === "BOWLER_CARD"
                  ? "border-pitch-green bg-pitch-green text-ink shadow-md shadow-pitch-green/30 scale-[1.02]"
                  : "border-pitch-green/30 bg-pitch-green/10 text-pitch-green hover:bg-pitch-green/20"
              }`}
            >
              <Flame size={14} />
              <span>Bowler Spell</span>
              {activeGraphic === "BOWLER_CARD" && <span className="text-[9px] font-black">● ON</span>}
            </button>

            <button
              onClick={() => toggleGraphic("PARTNERSHIP_CARD", 7000)}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition-all active:scale-95 ${
                activeGraphic === "PARTNERSHIP_CARD"
                  ? "border-signal-gold bg-signal-gold text-ink shadow-md shadow-signal-gold/30 scale-[1.02]"
                  : "border-signal-gold/30 bg-signal-gold/10 text-signal-gold hover:bg-signal-gold/20"
              }`}
            >
              <Users2 size={14} />
              <span>Partnership</span>
              {activeGraphic === "PARTNERSHIP_CARD" && <span className="text-[9px] font-black">● ON</span>}
            </button>

            <button
              onClick={() => toggleGraphic("MATCH_SUMMARY", 8000)}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition-all active:scale-95 ${
                activeGraphic === "MATCH_SUMMARY"
                  ? "border-sky-400 bg-sky-500 text-white shadow-md shadow-sky-500/30 scale-[1.02]"
                  : "border-sky-400/30 bg-sky-400/10 text-sky-400 hover:bg-sky-400/20"
              }`}
            >
              <FileBarChart size={14} />
              <span>Summary (8s)</span>
              {activeGraphic === "MATCH_SUMMARY" && <span className="text-[9px] font-black">● ON</span>}
            </button>

            <button
              onClick={() => toggleGraphic("INNINGS_BREAK")}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition-all active:scale-95 ${
                activeGraphic === "INNINGS_BREAK"
                  ? "border-crimson bg-crimson text-white shadow-md shadow-crimson/30 scale-[1.02]"
                  : "border-crimson/30 bg-crimson/10 text-crimson hover:bg-crimson/20"
              }`}
            >
              <ShieldAlert size={14} />
              <span>{activeGraphic === "INNINGS_BREAK" ? "Close Break" : "Innings Break"}</span>
              {activeGraphic === "INNINGS_BREAK" && <span className="text-[9px] font-black">● ON</span>}
            </button>

            <button
              onClick={() => toggleGraphic("RESULT_POSTER")}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-bold transition-all active:scale-95 ${
                activeGraphic === "RESULT_POSTER"
                  ? "border-amber-400 bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-[1.02]"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
              }`}
            >
              <Trophy size={14} />
              <span>{activeGraphic === "RESULT_POSTER" ? "Close Result" : "Result Poster"}</span>
              {activeGraphic === "RESULT_POSTER" && <span className="text-[9px] font-black">● ON</span>}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-fg-faint">
            Football Screen Graphics
          </label>
          <button
            onClick={() => toggleGraphic("INNINGS_BREAK")}
            className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all active:scale-95 ${
              activeGraphic === "INNINGS_BREAK"
                ? "border-pitch-green bg-pitch-green text-ink shadow-md shadow-pitch-green/30"
                : "border-pitch-green/30 bg-pitch-green/10 text-pitch-green hover:bg-pitch-green/20"
            }`}
          >
            <Activity size={15} />
            <span>{activeGraphic === "INNINGS_BREAK" ? "Close Match Summary Poster" : "Show Half-Time / Match Summary Poster"}</span>
            {activeGraphic === "INNINGS_BREAK" && <span className="text-[10px] font-black">● ON AIR</span>}
          </button>
        </div>
      )}

      {/* 2. Broadcast Theme Selection */}
      <div>
        <label className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-fg-faint">
          <LayoutTemplate size={13} /> Select Overlay Theme
        </label>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
          {themesList.map((t) => (
            <button
              key={t.id}
              onClick={() => changeTheme(t.id)}
              className={`min-h-[38px] rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                currentTheme === t.id
                  ? "border-electric bg-electric text-white shadow-md shadow-electric/25"
                  : "border-border bg-ink text-fg-muted hover:border-fg-faint hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Visibility Toggles & Sport-Aware Logo Manager */}
      <div className="space-y-3 border-t border-border pt-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            onClick={() => toggleVisibility("showScoreboard", showScoreboard)}
            className={`flex min-h-[40px] items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
              showScoreboard
                ? "border-pitch-green/40 bg-pitch-green/10 text-pitch-green"
                : "border-border bg-ink text-fg-faint"
            }`}
          >
            <Tv size={14} /> {showScoreboard ? "Scoreboard: Visible" : "Scoreboard: Hidden"}
          </button>

          <button
            onClick={() => toggleVisibility("showLogo", showLogo)}
            className={`flex min-h-[40px] items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
              showLogo
                ? "border-electric/40 bg-electric/10 text-electric"
                : "border-border bg-ink text-fg-faint"
            }`}
          >
            <Award size={14} /> {showLogo ? "TV Logo Badge: On" : "TV Logo Badge: Off"}
          </button>
        </div>

        {/* Logo Upload Box (ফুটবলের জন্য ১টি, ক্রিকেটের জন্য ২টি) */}
        <div className={`grid grid-cols-1 gap-3 ${isCricket ? "sm:grid-cols-2" : ""}`}>
          {/* Cricket Left Bug */}
          {isCricket && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-ink/60 p-3">
              <div className="flex items-center gap-3">
                {customLogoLeftUrl ? (
                  <img
                    src={customLogoLeftUrl}
                    alt="Left Bug"
                    className="h-9 w-9 rounded-lg border border-border bg-slate-900 object-contain p-1"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-panel text-[10px] font-black text-electric">
                    LEFT
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-fg">Top-Left Logo</div>
                  <div className="text-[10px] text-fg-muted">Tournament / Sponsor Bug</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="flex min-h-[34px] cursor-pointer items-center gap-1 rounded-lg border border-electric/40 bg-electric/15 px-2.5 py-1 text-xs font-bold text-electric hover:bg-electric/25">
                  <Upload size={12} />
                  <span>{uploadingSide === "left" ? "..." : "Upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, "left")}
                    className="hidden"
                  />
                </label>
                {customLogoLeftUrl && (
                  <button
                    onClick={() => removeCustomLogo("left")}
                    className="p-1 text-crimson hover:opacity-80"
                    title="Remove Logo"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Fixed Right Bug (Cricket & Football) */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-ink/60 p-3">
            <div className="flex items-center gap-3">
              {customLogoUrl ? (
                <img
                  src={customLogoUrl}
                  alt="Channel Watermark"
                  className="h-9 w-9 rounded-lg border border-border bg-slate-900 object-contain p-1"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-panel text-[10px] font-black text-amber-400">
                  NS
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-fg">
                  {isCricket ? "Top-Right TV Watermark" : "Broadcast Watermark Logo"}
                </div>
                <div className="text-[10px] text-fg-muted">Official Channel Badge (Top-Right)</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="flex min-h-[34px] cursor-pointer items-center gap-1 rounded-lg border border-signal-gold/40 bg-signal-gold/15 px-2.5 py-1 text-xs font-bold text-signal-gold hover:bg-signal-gold/25">
                <Upload size={12} />
                <span>{uploadingSide === "right" ? "..." : "Upload"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e, "right")}
                  className="hidden"
                />
              </label>
              {customLogoUrl && (
                <button
                  onClick={() => removeCustomLogo("right")}
                  className="p-1 text-crimson hover:opacity-80"
                  title="Remove Logo"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}