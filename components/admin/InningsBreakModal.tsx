// components/admin/InningsBreakModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Trophy, PlayCircle } from "lucide-react";
import { useToast } from "@/lib/context/ToastContext";
import ResponsiveModal from "@/components/common/ResponsiveModal";
import type { Player } from "@/lib/types/match";

interface InningsBreakModalProps {
  isOpen: boolean;
  onClose?: () => void;
  targetScore: number;
  chasingTeamName: string;
  defendingTeamName: string;
  chasingSquad: Player[];
  defendingSquad: Player[];
  onStartSecondInnings: (strikerId: string, nonStrikerId: string, bowlerId: string) => void;
}

export default function InningsBreakModal({
  isOpen,
  onClose,
  targetScore,
  chasingTeamName,
  defendingTeamName,
  chasingSquad,
  defendingSquad,
  onStartSecondInnings,
}: InningsBreakModalProps) {
  const { showToast } = useToast();
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStriker("");
      setNonStriker("");
      setBowler("");
    }
  }, [isOpen]);

  const handleStart = () => {
    if (!striker || !nonStriker || !bowler) {
      return showToast("২য় ইনিংস শুরু করতে ৩ জন খেলোয়াড়ই নির্বাচন করুন।", "error");
    }
    if (striker === nonStriker) {
      return showToast("স্ট্রাইকার ও নন-স্ট্রাইকার ভিন্ন খেলোয়াড় হতে হবে।", "error");
    }
    onStartSecondInnings(striker, nonStriker, bowler);
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose || (() => {})}
      title="Innings Break"
      icon={<Trophy size={20} />}
      accent="gold"
      footer={
        <div className="flex w-full gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-3 text-sm font-medium text-fg-muted transition-colors hover:bg-panel"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleStart}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-signal-gold px-8 py-3 text-base font-bold text-ink shadow-lg shadow-signal-gold/20 transition-opacity hover:opacity-90"
          >
            <span>Start 2nd Innings</span>
            <PlayCircle size={20} />
          </button>
        </div>
      }
    >
      <div className="rounded-2xl border border-signal-gold/30 bg-signal-gold/10 p-5 text-center">
        <span className="text-sm font-medium text-fg-muted">Target for {chasingTeamName}: </span>
        <span className="font-score text-3xl font-black text-signal-gold">{targetScore}</span>
        <span className="ml-1 text-sm font-medium text-fg-muted">Runs</span>
      </div>

      <div className="rounded-2xl border border-border bg-ink p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-electric">Batting: {chasingTeamName}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-fg-faint">Striker *</label>
            <select
              value={striker}
              onChange={(e) => setStriker(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-border bg-panel p-3 text-fg outline-none transition-colors focus:border-electric"
            >
              <option value="">Select Striker...</option>
              {chasingSquad.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isCaptain ? "(C)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-fg-faint">Non-Striker *</label>
            <select
              value={nonStriker}
              onChange={(e) => setNonStriker(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-border bg-panel p-3 text-fg outline-none transition-colors focus:border-electric"
            >
              <option value="">Select Non-Striker...</option>
              {chasingSquad
                .filter((p) => p.id !== striker)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isCaptain ? "(C)" : ""}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-ink p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-crimson">Bowling: {defendingTeamName}</h3>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-fg-faint">Opening Bowler *</label>
          <select
            value={bowler}
            onChange={(e) => setBowler(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-border bg-panel p-3 text-fg outline-none transition-colors focus:border-crimson"
          >
            <option value="">Select Opening Bowler...</option>
            {defendingSquad.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.isCaptain ? "(C)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    </ResponsiveModal>
  );
}