// components/admin/NewBowlerModal.tsx
"use client";

import { useState, useEffect } from "react";
import { UserCheck, ShieldAlert, RotateCcw } from "lucide-react";
import ResponsiveModal from "@/components/common/ResponsiveModal";
import type { Player } from "@/lib/types/match";
import { useToast } from "@/lib/context/ToastContext";

interface NewBowlerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bowlerId: string) => void;
  onUndo?: () => void;
  bowlingSquad: Player[];
  activeBowlerId?: string;
  restrictedBowlerId?: string;
  isMandatory?: boolean;
}

export default function NewBowlerModal({
  isOpen,
  onClose,
  onConfirm,
  onUndo,
  bowlingSquad = [],
  activeBowlerId,
  restrictedBowlerId,
  isMandatory = false,
}: NewBowlerModalProps) {
  const { showToast } = useToast();
  const [selectedBowlerId, setSelectedBowlerId] = useState<string>("");

  // 🛡️ যে বোলার মাত্র ওভার শেষ করেছেন
  const blockedBowlerId = restrictedBowlerId || activeBowlerId;

  useEffect(() => {
    if (isOpen) {
      // নিষিদ্ধ বোলার ছাড়া প্রথম ভ্যালিড বোলারকে ফোকাস করা
      const firstValidBowler = bowlingSquad.find((p) => p.id !== blockedBowlerId);
      setSelectedBowlerId(firstValidBowler?.id || "");
    }
  }, [isOpen, blockedBowlerId, bowlingSquad]);

  const handleSubmit = () => {
    if (!selectedBowlerId) {
      return showToast("বোলার নির্বাচন করুন।", "error");
    }

    if (selectedBowlerId === blockedBowlerId) {
      return showToast("একই বোলার পরপর দুই ওভার বল করতে পারবেন না।", "error");
    }

    onConfirm(selectedBowlerId);
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={isMandatory ? () => {} : onClose}
      title="Select Bowler for Next Over"
      icon={<UserCheck size={20} />}
      accent="electric"
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          {onUndo && (
            <button
              type="button"
              onClick={() => {
                onUndo();
                onClose();
              }}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-panel px-3.5 py-2.5 text-xs font-bold text-fg-muted hover:border-amber-400/50 hover:text-amber-400"
            >
              <RotateCcw size={14} /> Undo Last Ball
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] rounded-xl px-4 py-2.5 text-xs font-medium text-fg-muted transition-colors hover:bg-panel"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedBowlerId || selectedBowlerId === blockedBowlerId}
              className="min-h-[44px] rounded-xl bg-electric px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-electric/25 transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Confirm Bowler
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-fg-muted">
            Choose Bowler from Squad
          </label>
          <span className="text-[11px] text-fg-faint">
            *পরপর দুই ওভার বোলিং করা নিষেধ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
          {bowlingSquad.map((player) => {
            const isBlocked = player.id === blockedBowlerId;
            const isSelected = selectedBowlerId === player.id;

            return (
              <button
                key={player.id}
                type="button"
                disabled={isBlocked}
                onClick={() => setSelectedBowlerId(player.id)}
                className={`flex min-h-[48px] items-center justify-between rounded-xl border-2 p-3 text-left text-xs transition-all ${
                  isBlocked
                    ? "cursor-not-allowed border-border/50 bg-ink/40 opacity-50"
                    : isSelected
                    ? "border-electric bg-electric/20 text-electric font-bold shadow-sm"
                    : "border-border bg-ink text-fg hover:border-fg-faint"
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="truncate font-bold">
                    {player.name} {player.isCaptain ? "(C)" : ""}
                  </div>
                  <div className="text-[10px] text-fg-muted font-normal uppercase">
                    {player.role || "Bowler"}
                  </div>
                </div>

                {isBlocked ? (
                  <span className="flex items-center gap-1 rounded-md border border-crimson/30 bg-crimson/15 px-1.5 py-0.5 text-[9px] font-bold text-crimson">
                    <ShieldAlert size={11} /> শেষ ওভার
                  </span>
                ) : isSelected ? (
                  <span className="h-2 w-2 rounded-full bg-electric animate-ping" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </ResponsiveModal>
  );
}