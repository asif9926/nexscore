// components/admin/ExtrasModal.tsx
"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import ResponsiveModal from "@/components/common/ResponsiveModal";

interface ExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { type: string; extraRunsRan: number; isFromBat?: boolean }) => void;
}

export default function ExtrasModal({ isOpen, onClose, onConfirm }: ExtrasModalProps) {
  const [extraType, setExtraType] = useState<string>("Wide");
  const [extraRunsRan, setExtraRunsRan] = useState<number>(0);
  const [isFromBat, setIsFromBat] = useState<boolean>(false);

  const handleSubmit = () => {
    onConfirm({ type: extraType, extraRunsRan, isFromBat });
    setExtraRunsRan(0);
    setIsFromBat(false);
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Extras"
      icon={<PlusCircle size={20} />}
      accent="electric"
      footer={
        <div className="flex gap-3">
          <button onClick={onClose} className="rounded-xl px-5 py-3 font-medium text-fg-muted hover:bg-panel">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="min-h-[44px] flex-1 rounded-xl bg-electric px-6 py-3 font-bold text-white shadow-lg shadow-electric/20 hover:opacity-90"
          >
            Confirm Extra
          </button>
        </div>
      }
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-fg-muted">Extra Type</label>
        <div className="grid grid-cols-2 gap-3">
          {["Wide", "No Ball", "Bye", "Leg Bye"].map((type) => (
            <button
              key={type}
              onClick={() => {
                setExtraType(type);
                if (type !== "No Ball") setIsFromBat(false);
              }}
              className={`min-h-[44px] rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                extraType === type
                  ? "border-electric bg-electric/20 text-electric"
                  : "border-border bg-ink text-fg-muted hover:border-fg-faint"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-fg-muted">
          {extraType === "No Ball" ? "Runs Scored from Shot (0 - 6)" : "Additional Runs Ran (Optional)"}
        </label>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 6].map((run) => (
            <button
              key={run}
              onClick={() => setExtraRunsRan(run)}
              className={`min-h-[44px] flex-1 rounded-xl border text-lg font-bold transition-all ${
                extraRunsRan === run
                  ? "border-electric bg-electric text-white"
                  : "border-border bg-ink text-fg-muted hover:bg-panel"
              }`}
            >
              {run}
            </button>
          ))}
        </div>

        {extraType === "No Ball" && extraRunsRan > 0 && (
          <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-fg cursor-pointer">
            <input
              type="checkbox"
              checked={isFromBat}
              onChange={(e) => setIsFromBat(e.target.checked)}
              className="rounded border-border text-electric"
            />
            Runs hit from bat (Credited to Striker)
          </label>
        )}

        <p className="mt-2 text-xs text-fg-faint">
          * Wide/No Ball-এর জন্য ১ পেনাল্টি রান স্বয়ংক্রিয়ভাবে যোগ হবে।
        </p>
      </div>
    </ResponsiveModal>
  );
}