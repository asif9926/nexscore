// components/admin/ReviseTargetModal.tsx
"use client";

import { useState, useEffect } from "react";
import { CloudRain, Check, AlertCircle } from "lucide-react";
import ResponsiveModal from "@/components/common/ResponsiveModal";
import { useToast } from "@/lib/context/ToastContext";

interface ReviseTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { revisedTarget?: number; revisedMaxOvers: number }) => void;
  currentInningsNumber: 1 | 2;
  currentTarget: number;
  currentMaxOvers: number;
  currentScore: number;
  currentOvers: string;
  battingTeam: string;
}

export default function ReviseTargetModal({
  isOpen,
  onClose,
  onConfirm,
  currentInningsNumber,
  currentTarget,
  currentMaxOvers,
  currentScore,
  currentOvers,
  battingTeam,
}: ReviseTargetModalProps) {
  const { showToast } = useToast();
  const [target, setTarget] = useState<number>(currentTarget || 0);
  const [maxOvers, setMaxOvers] = useState<number>(currentMaxOvers || 20);

  const isSecondInnings = currentInningsNumber === 2;

  useEffect(() => {
    if (isOpen) {
      setTarget(currentTarget || 0);
      setMaxOvers(currentMaxOvers || 20);
    }
  }, [isOpen, currentTarget, currentMaxOvers]);

  const handleSubmit = () => {
    if (!maxOvers || maxOvers <= 0) {
      return showToast("সঠিক ওভার সংখ্যা ইনপুট দিন।", "error");
    }

    if (isSecondInnings && (!target || target <= 0)) {
      return showToast("২য় ইনিংসের জন্য সংশোধিত টার্গেট দিন।", "error");
    }

    onConfirm({
      revisedMaxOvers: Number(maxOvers),
      ...(isSecondInnings ? { revisedTarget: Number(target) } : {}),
    });
    onClose();
  };

  const runsNeeded = Math.max(0, target - currentScore);

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={isSecondInnings ? "Rain Delay / DLS Target Override" : "Revise Match Overs (Rain Delay)"}
      icon={<CloudRain size={20} />}
      accent="electric"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-medium text-fg-muted transition-colors hover:bg-panel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-electric px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-electric/20 transition-opacity hover:opacity-90"
          >
            <Check size={14} />
            <span>{isSecondInnings ? "Apply Rain Target" : "Update Match Overs"}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="space-y-1 rounded-xl border border-electric/30 bg-electric/10 p-3.5">
          <div className="flex items-center gap-1.5 font-bold text-electric">
            <AlertCircle size={14} />
            <span>
              {isSecondInnings ? `Match State: ${battingTeam} 2nd Innings (Chase)` : `Match State: ${battingTeam} 1st Innings`}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-fg-muted">
            Current Score: <strong className="text-fg">{currentScore} runs</strong> in{" "}
            <strong className="text-fg">{currentOvers} overs</strong> (Original: {currentMaxOvers} ov).
          </p>
        </div>

        <div>
          <label className="mb-1.5 block font-bold uppercase tracking-wider text-fg-muted">
            Revised Total Match Overs *
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={maxOvers || ""}
            onChange={(e) => setMaxOvers(Number(e.target.value))}
            placeholder="e.g. 10 or 12"
            className="min-h-[44px] w-full rounded-xl border border-border bg-ink p-3 text-sm font-bold text-fg outline-none focus:border-electric"
          />
        </div>

        {isSecondInnings && (
          <div>
            <label className="mb-1.5 block font-bold uppercase tracking-wider text-fg-muted">
              Revised Target Score (Runs) *
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={target || ""}
              onChange={(e) => setTarget(Number(e.target.value))}
              placeholder="e.g. 85"
              className="min-h-[44px] w-full rounded-xl border border-border bg-ink p-3 text-sm font-bold text-signal-gold outline-none focus:border-signal-gold"
            />
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl border border-border bg-ink p-3 text-xs font-semibold">
          <span className="text-fg-muted">Equation:</span>
          {isSecondInnings ? (
            <span className="font-bold text-signal-gold">
              {battingTeam} will need {runsNeeded} runs in {maxOvers} overs
            </span>
          ) : (
            <span className="font-bold text-electric">
              Match revised to {maxOvers} overs per side
            </span>
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
}