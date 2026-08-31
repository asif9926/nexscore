"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useToast } from "@/lib/context/ToastContext";
import ResponsiveModal from "@/components/common/ResponsiveModal";
import type { Player } from "@/lib/types/match";

interface NewBowlerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bowlerId: string) => void;
  bowlingSquad: Player[];
  activeBowlerId?: string;
  isMandatory?: boolean;
}

export default function NewBowlerModal({
  isOpen,
  onClose,
  onConfirm,
  bowlingSquad,
  activeBowlerId,
  isMandatory = false,
}: NewBowlerModalProps) {
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState<string>("");

  const handleSubmit = () => {
    if (!selectedId) return showToast("Please choose a bowler to proceed.", "error");
    onConfirm(selectedId);
    setSelectedId("");
  };

  const handleClose = () => {
    if (isMandatory) {
      showToast("নতুন ওভারের জন্য বোলার নির্বাচন করা বাধ্যতামূলক!", "error");
      return;
    }
    onClose();
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Select Next Bowler"
      icon={<UserPlus size={20} />}
      accent="electric"
      footer={
        <div className="flex gap-3">
          {!isMandatory && (
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-medium text-fg-muted transition-colors hover:bg-panel"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!selectedId}
            className="min-h-[44px] flex-1 rounded-xl bg-electric px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-electric/20 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Confirm Bowler
          </button>
        </div>
      }
    >
      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-fg-muted">
            Choose bowler for next over *
          </label>
          {isMandatory && (
            <span className="rounded bg-crimson/15 px-2 py-0.5 text-[10px] font-bold text-crimson">
              Required
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {bowlingSquad
            .filter((p) => p.id !== activeBowlerId)
            .map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`min-h-[46px] rounded-xl border-2 px-3 py-2 text-left text-xs font-bold transition-all ${
                  selectedId === p.id
                    ? "border-electric bg-electric/20 text-electric shadow-sm"
                    : "border-border bg-ink text-fg-muted hover:border-fg-faint hover:text-fg"
                }`}
              >
                <span className="block truncate">{p.name}</span>
                <span className="text-[9px] uppercase font-normal text-fg-faint">{p.role}</span>
              </button>
            ))}
        </div>
      </div>
    </ResponsiveModal>
  );
}