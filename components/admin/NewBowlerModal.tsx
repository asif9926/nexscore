// components/admin/NewBowlerModal.tsx
"use client";

import { useState } from "react";
import { UserPlus, RotateCcw } from "lucide-react";
import { useToast } from "@/lib/context/ToastContext";
import ResponsiveModal from "@/components/common/ResponsiveModal";
import type { Player } from "@/lib/types/match";

interface NewBowlerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bowlerId: string) => void;
  onUndo?: () => void;
  bowlingSquad: Player[];
  activeBowlerId?: string;
  isMandatory?: boolean;
}

export default function NewBowlerModal({
  isOpen,
  onClose,
  onConfirm,
  onUndo,
  bowlingSquad = [],
  activeBowlerId,
}: NewBowlerModalProps) {
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState<string>("");

  const handleSubmit = () => {
    if (!selectedId) {
      showToast("দয়া করে একজন বোলার নির্বাচন করুন।", "error");
      return;
    }
    onConfirm(selectedId);
    setSelectedId("");
    onClose(); // 👈 এটি নিশ্চিতভাবে মডাল বন্ধ করবে
  };

  const handleModalUndo = () => {
    if (onUndo) {
      onUndo();
      onClose();
      showToast("আগের বল আনডু করা হয়েছে।", "info");
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Next Bowler"
      icon={<UserPlus size={20} />}
      accent="electric"
      footer={
        <div className="flex w-full items-center gap-2.5">
          {onUndo && (
            <button
              type="button"
              onClick={handleModalUndo}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-crimson/40 bg-crimson/15 px-3.5 py-2.5 text-xs font-bold text-crimson transition-all hover:bg-crimson/25 active:scale-95"
              title="আগের বলটিতে কোনো ভুল থাকলে আনডু করুন"
            >
              <RotateCcw size={13} />
              <span>Undo Ball</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-medium text-fg-muted transition-colors hover:bg-panel"
          >
            Close
          </button>

          <button
            type="button"
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
            Choose bowler for next over
          </label>
          <span className="rounded bg-electric/15 px-2 py-0.5 text-[10px] font-bold text-electric">
            Over Finished
          </span>
        </div>

        <div className="grid max-h-[260px] grid-cols-2 gap-2.5 overflow-y-auto pr-1">
          {bowlingSquad
            .filter((p) => p.id !== activeBowlerId)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`min-h-[46px] rounded-xl border-2 px-3 py-2 text-left text-xs font-bold transition-all ${
                  selectedId === p.id
                    ? "border-electric bg-electric/20 text-electric shadow-sm"
                    : "border-border bg-ink text-fg-muted hover:border-fg-faint hover:text-fg"
                }`}
              >
                <span className="block truncate">{p.name}</span>
                <span className="text-[9px] font-normal uppercase text-fg-faint">{p.role}</span>
              </button>
            ))}
        </div>
      </div>
    </ResponsiveModal>
  );
}