"use client";

import { useState, useEffect } from "react";
import { Goal, Sparkles, UserCheck } from "lucide-react";
import ResponsiveModal from "@/components/common/ResponsiveModal";
import type { Player } from "@/lib/types/match";
import { useToast } from "@/lib/context/ToastContext";

interface FootballGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    scorerId: string;
    scorerName: string;
    assistId?: string;
    assistName?: string;
    minute: number;
  }) => void;
  teamName: string;
  squad: Player[];
  currentMinute: number;
}

export default function FootballGoalModal({
  isOpen,
  onClose,
  onConfirm,
  teamName,
  squad = [],
  currentMinute = 1,
}: FootballGoalModalProps) {
  const { showToast } = useToast();
  const [scorerId, setScorerId] = useState<string>("");
  const [assistId, setAssistId] = useState<string>("");
  const [minute, setMinute] = useState<number>(currentMinute);

  useEffect(() => {
    if (isOpen) {
      setMinute(currentMinute || 1);
      setScorerId("");
      setAssistId("");
    }
  }, [isOpen, currentMinute]);

  const handleSubmit = () => {
    if (!scorerId) {
      return showToast("দয়া করে গোলদাতার নাম সিলেক্ট করুন।", "error");
    }

    const scorer = squad.find((p) => p.id === scorerId);
    const assist = squad.find((p) => p.id === assistId);

    onConfirm({
      scorerId,
      scorerName: scorer?.name || "Player",
      assistId: assist ? assist.id : undefined,
      assistName: assist ? assist.name : undefined,
      minute: Number(minute) || 1,
    });

    onClose();
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Goal Scored! • ${teamName}`}
      icon={<Goal size={20} />}
      accent="green"
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-medium text-fg-muted transition-colors hover:bg-panel"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!scorerId}
            className="min-h-[44px] flex-1 rounded-xl bg-pitch-green px-5 py-2.5 text-xs font-bold text-ink shadow-lg shadow-pitch-green/20 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Confirm Goal ⚽
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Match Minute */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-fg-muted">
            Match Minute
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={130}
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              className="min-h-[42px] w-28 rounded-xl border border-border bg-ink p-2.5 text-center font-mono text-base font-bold text-pitch-green outline-none focus:border-pitch-green"
            />
            <span className="text-xs text-fg-muted">Minute of Goal</span>
          </div>
        </div>

        {/* Goal Scorer Selection */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-fg-muted">
            Goal Scorer *
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {squad.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => setScorerId(player.id)}
                className={`flex min-h-[44px] flex-col justify-center rounded-xl border-2 p-2 text-left text-xs transition-all ${
                  scorerId === player.id
                    ? "border-pitch-green bg-pitch-green/20 text-pitch-green font-bold shadow-sm"
                    : "border-border bg-ink text-fg hover:border-fg-faint"
                }`}
              >
                <span className="truncate">{player.name}</span>
                <span className="text-[10px] text-fg-muted font-normal uppercase">{player.role}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Assist Provider Selection */}
        <div>
          <label className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-fg-muted">
            <span>Assist Provider (Optional)</span>
            {assistId && (
              <button
                type="button"
                onClick={() => setAssistId("")}
                className="text-[10px] text-crimson hover:underline"
              >
                Remove Assist
              </button>
            )}
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => setAssistId("")}
              className={`min-h-[38px] rounded-xl border p-2 text-center text-xs transition-all ${
                !assistId
                  ? "border-electric/50 bg-electric/15 text-electric font-bold"
                  : "border-border bg-ink text-fg-muted hover:border-fg-faint"
              }`}
            >
              Solo Goal (No Assist)
            </button>
            {squad
              .filter((p) => p.id !== scorerId)
              .map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => setAssistId(player.id)}
                  className={`flex min-h-[38px] flex-col justify-center rounded-xl border p-2 text-left text-xs transition-all ${
                    assistId === player.id
                      ? "border-electric bg-electric/20 text-electric font-bold shadow-sm"
                      : "border-border bg-ink text-fg hover:border-fg-faint"
                  }`}
                >
                  <span className="truncate">{player.name}</span>
                  <span className="text-[9px] text-fg-muted font-normal uppercase">{player.role}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}