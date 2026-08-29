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
}

export default function NewBowlerModal({ isOpen, onClose, onConfirm, bowlingSquad, activeBowlerId }: NewBowlerModalProps) {
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState<string>("");

  const handleSubmit = () => {
    if (!selectedId) return showToast("Please choose a bowler to proceed.", "error");
    onConfirm(selectedId);
    setSelectedId("");
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Next Bowler"
      icon={<UserPlus size={20} />}
      accent="electric"
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
            disabled={!selectedId}
            className="min-h-[44px] flex-1 rounded-xl bg-electric px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-electric/20 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Confirm Bowler
          </button>
        </div>
      }
    >
      <div>
        <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-fg-muted">
          Choose bowler for next over *
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {bowlingSquad
            .filter((p) => p.id !== activeBowlerId)
            .map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`min-h-[44px] rounded-xl border-2 px-3 py-2 text-left text-xs font-bold transition-all ${
                  selectedId === p.id
                    ? "border-electric bg-electric/20 text-electric"
                    : "border-border bg-ink text-fg-muted hover:border-fg-faint"
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