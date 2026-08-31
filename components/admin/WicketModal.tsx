"use client";

import { useState } from "react";
import { UserMinus } from "lucide-react";
import { useToast } from "@/lib/context/ToastContext";
import ResponsiveModal from "@/components/common/ResponsiveModal";
import type { Batsman, Player } from "@/lib/types/match";

interface WicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    outBatsmanId: string;
    newBatsmanId: string;
    dismissalType: string;
    runsCompleted?: number;
    isWideDelivery?: boolean;
  }) => void;
  activeBatsmen: Batsman[];
  availableBatsmen: Player[];
}

export default function WicketModal({ isOpen, onClose, onConfirm, activeBatsmen, availableBatsmen }: WicketModalProps) {
  const { showToast } = useToast();
  const [outBatsmanId, setOutBatsmanId] = useState<string>(activeBatsmen.find((b) => b.onStrike)?.id || "");
  const [newBatsmanId, setNewBatsmanId] = useState<string>("");
  const [dismissalType, setDismissalType] = useState<string>("Bowled");
  const [runsCompleted, setRunsCompleted] = useState<number>(0);
  const [isWideDelivery, setIsWideDelivery] = useState<boolean>(false);

  const isFormValid = outBatsmanId.trim() !== "" && (availableBatsmen.length === 0 || newBatsmanId.trim() !== "");

  const handleSubmit = () => {
    if (!outBatsmanId) return showToast("Please select the dismissed batsman.", "error");
    if (availableBatsmen.length > 0 && !newBatsmanId) {
      return showToast("Please select the next batsman in.", "error");
    }
    onConfirm({
      outBatsmanId,
      newBatsmanId,
      dismissalType,
      runsCompleted,
      isWideDelivery,
    });
    setNewBatsmanId("");
    setRunsCompleted(0);
    setIsWideDelivery(false);
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Fall of Wicket"
      icon={<UserMinus size={20} />}
      accent="crimson"
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
            disabled={!isFormValid}
            className="min-h-[44px] flex-1 rounded-xl bg-crimson px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-crimson/20 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Confirm Wicket
          </button>
        </div>
      }
    >
      {/* ১. কোন ব্যাটার আউট হলো */}
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-fg-muted">Who is Out? *</label>
        <div className="grid grid-cols-2 gap-2.5">
          {activeBatsmen.map((b) => (
            <button
              key={b.id}
              onClick={() => setOutBatsmanId(b.id)}
              className={`min-h-[44px] rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all ${
                outBatsmanId === b.id
                  ? "border-crimson bg-crimson/20 text-crimson"
                  : "border-border bg-ink text-fg-muted hover:border-fg-faint"
              }`}
            >
              {b.name} {b.onStrike ? "(Striker)" : "(Non-Striker)"}
            </button>
          ))}
        </div>
      </div>

      {/* ২. ডিসমিসাল টাইপ */}
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-fg-muted">Dismissal Type</label>
        <select
          value={dismissalType}
          onChange={(e) => setDismissalType(e.target.value)}
          className="min-h-[44px] w-full rounded-xl border border-border bg-ink p-3 text-xs text-fg outline-none focus:border-crimson"
        >
          <option>Bowled</option>
          <option>Caught</option>
          <option>LBW</option>
          <option>Run Out</option>
          <option>Stumped</option>
          <option>Hit Wicket</option>
        </select>
      </div>

      {/* ৩. রান আউটের সময় রান সম্পন্ন হয়েছে কি না */}
      {dismissalType === "Run Out" && (
        <div className="space-y-2 rounded-xl border border-border bg-ink/60 p-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-fg-muted">
            Runs Completed before Run Out
          </label>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRunsCompleted(r)}
                className={`min-h-[38px] flex-1 rounded-lg border text-xs font-bold transition-all ${
                  runsCompleted === r
                    ? "border-electric bg-electric text-white"
                    : "border-border bg-panel text-fg-muted hover:bg-panel-raised"
                }`}
              >
                {r} Run{r > 1 ? "s" : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ৪. ওয়াইড বলে উইকেট (স্টাম্পিং/রানআউট) */}
      {(dismissalType === "Stumped" || dismissalType === "Run Out") && (
        <label className="flex items-center gap-2 text-xs font-semibold text-fg cursor-pointer rounded-xl border border-border/80 bg-ink p-2.5">
          <input
            type="checkbox"
            checked={isWideDelivery}
            onChange={(e) => setIsWideDelivery(e.target.checked)}
            className="rounded border-border text-crimson"
          />
          <span>Was this on a <b>Wide Delivery</b>? (+1 Wide extra added)</span>
        </label>
      )}

      {/* ৫. পরবর্তী ব্যাটার নির্বাচন */}
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-fg-muted">New Batsman In *</label>
        {availableBatsmen.length === 0 ? (
          <p className="text-xs text-crimson font-medium p-2 bg-crimson/10 rounded-lg">
            No more batsmen available in squad (All Out).
          </p>
        ) : (
          <select
            value={newBatsmanId}
            onChange={(e) => setNewBatsmanId(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-border bg-ink p-3 text-xs text-fg outline-none focus:border-crimson"
          >
            <option value="">Select Next Batsman...</option>
            {availableBatsmen.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.role})
              </option>
            ))}
          </select>
        )}
      </div>
    </ResponsiveModal>
  );
}