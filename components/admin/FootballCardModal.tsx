// components/admin/FootballCardModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Square } from "lucide-react";
import ResponsiveModal from "@/components/common/ResponsiveModal";
import type { Player } from "@/lib/types/match";
import { useToast } from "@/lib/context/ToastContext";

interface FootballCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    playerId: string;
    playerName: string;
    cardType: "yellow" | "red";
    minute: number;
  }) => void;
  teamName: string;
  squad: Player[];
  defaultCardType: "yellow" | "red";
  currentMinute: number;
}

export default function FootballCardModal({
  isOpen,
  onClose,
  onConfirm,
  teamName,
  squad = [],
  defaultCardType = "yellow",
  currentMinute = 1,
}: FootballCardModalProps) {
  const { showToast } = useToast();
  const [playerId, setPlayerId] = useState<string>("");
  const [cardType, setCardType] = useState<"yellow" | "red">(defaultCardType);
  const [minute, setMinute] = useState<number>(currentMinute);

  useEffect(() => {
    if (isOpen) {
      setCardType(defaultCardType);
      setMinute(Math.max(1, Math.min(130, currentMinute || 1)));
      setPlayerId("");
    }
  }, [isOpen, defaultCardType, currentMinute]);

  const handleSubmit = () => {
    if (!playerId) {
      return showToast("দয়া করে কার্ডপ্রাপ্ত খেলোয়াড় সিলেক্ট করুন।", "error");
    }

    const player = squad.find((p) => p.id === playerId);
    const validMinute = Math.max(1, Math.min(130, Number(minute) || 1));

    onConfirm({
      playerId,
      playerName: player?.name || "Player",
      cardType,
      minute: validMinute,
    });

    onClose();
  };

  const isYellow = cardType === "yellow";

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Disciplinary Card • ${teamName}`}
      icon={<Square size={18} className={isYellow ? "fill-signal-gold text-signal-gold" : "fill-crimson text-crimson"} />}
      accent={isYellow ? "gold" : "crimson"}
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
            disabled={!playerId}
            className={`min-h-[44px] flex-1 rounded-xl px-5 py-2.5 text-xs font-bold shadow-lg transition-opacity hover:opacity-90 disabled:opacity-40 ${
              isYellow
                ? "bg-signal-gold text-ink shadow-signal-gold/20"
                : "bg-crimson text-white shadow-crimson/20"
            }`}
          >
            Confirm {isYellow ? "Yellow Card 🟨" : "Red Card 🟥"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Card Type Toggle */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-fg-muted">
            Select Card Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCardType("yellow")}
              className={`flex-1 min-h-[40px] rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                isYellow
                  ? "border-signal-gold bg-signal-gold/20 text-signal-gold"
                  : "border-border bg-ink text-fg-muted"
              }`}
            >
              <Square size={13} className="fill-signal-gold text-signal-gold" /> Yellow Card
            </button>
            <button
              type="button"
              onClick={() => setCardType("red")}
              className={`flex-1 min-h-[40px] rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                !isYellow
                  ? "border-crimson bg-crimson/20 text-crimson"
                  : "border-border bg-ink text-fg-muted"
              }`}
            >
              <Square size={13} className="fill-crimson text-crimson" /> Red Card
            </button>
          </div>
        </div>

        {/* Match Minute */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-fg-muted">
            Match Minute
          </label>
          <input
            type="number"
            min={1}
            max={130}
            value={minute}
            onChange={(e) => setMinute(Math.max(1, Math.min(130, Number(e.target.value) || 1)))}
            className="min-h-[42px] w-28 rounded-xl border border-border bg-ink p-2.5 text-center font-mono text-base font-bold text-fg outline-none focus:border-electric"
          />
        </div>

        {/* Player Selection */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-fg-muted">
            Carded Player *
          </label>
          {squad.length === 0 ? (
            <p className="text-xs text-fg-faint italic p-3 bg-ink rounded-xl border border-border">স্কোয়াডে কোনো খেলোয়াড় নেই</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {squad.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => setPlayerId(player.id)}
                  className={`flex min-h-[44px] flex-col justify-center rounded-xl border-2 p-2 text-left text-xs transition-all ${
                    playerId === player.id
                      ? isYellow
                        ? "border-signal-gold bg-signal-gold/20 text-signal-gold font-bold shadow-sm"
                        : "border-crimson bg-crimson/20 text-crimson font-bold shadow-sm"
                      : "border-border bg-ink text-fg hover:border-fg-faint"
                  }`}
                >
                  <span className="truncate">{player.name}</span>
                  <span className="text-[10px] text-fg-muted font-normal uppercase">{player.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
}