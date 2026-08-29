"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type Accent = "crimson" | "electric" | "gold" | "green" | "neutral";

const accentStyles: Record<Accent, { header: string; title: string; icon: string }> = {
  crimson: { header: "bg-crimson/10 border-crimson/30", title: "text-crimson", icon: "text-crimson" },
  electric: { header: "bg-electric/10 border-electric/30", title: "text-electric", icon: "text-electric" },
  gold: { header: "bg-signal-gold/10 border-signal-gold/30", title: "text-signal-gold", icon: "text-signal-gold" },
  green: { header: "bg-pitch-green/10 border-pitch-green/30", title: "text-pitch-green", icon: "text-pitch-green" },
  neutral: { header: "bg-panel-raised border-border", title: "text-fg", icon: "text-fg-muted" },
};

/** True below the `sm` breakpoint. Drives which entrance animation + shape we use. */
function useIsMobile(breakpointPx = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpointPx]);
  return isMobile;
}

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  /** Ties the modal's accent color to what it represents — Wicket = crimson, etc. */
  accent?: Accent;
  /** Scrollable body content. Keep this the only thing that scrolls. */
  children: ReactNode;
  /** Always-visible action row. Never put the confirm button inside `children`. */
  footer: ReactNode;
}

/**
 * Renders as a bottom sheet on mobile (slides up, rounded top corners, drag
 * handle) and a centered dialog on desktop. In both cases the header and
 * footer are fixed and only the body scrolls, so the confirm button can
 * never be pushed off-screen — this is the fix for the modal overflow bug
 * found in the original WicketModal / InningsBreakModal / ExtrasModal /
 * NewBowlerModal (no max-height + no internal scroll on tall content).
 */
export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  icon,
  accent = "neutral",
  children,
  footer,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (!isOpen) return null;
  const a = accentStyles[accent];

  const variants = isMobile
    ? {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
      }
    : {
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 },
      };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="flex w-full flex-col overflow-hidden rounded-t-2xl border border-border
                     bg-panel shadow-2xl sm:max-w-md sm:rounded-2xl
                     max-h-[85vh] sm:max-h-[90vh]"
        >
          {/* Drag handle — mobile only, signals "this is a sheet, swipe/scroll" */}
          <div className="flex shrink-0 justify-center pb-1 pt-2.5 sm:hidden">
            <div className="h-1.5 w-10 rounded-full bg-fg-faint/40" />
          </div>

          {/* Header — fixed */}
          <div className={`flex shrink-0 items-center justify-between border-b p-4 ${a.header}`}>
            <h3 className={`flex items-center gap-2 text-lg font-bold sm:text-xl ${a.title}`}>
              {icon && <span className={a.icon}>{icon}</span>}
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-fg-muted transition-colors hover:text-fg"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body — the only scrollable region */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">{children}</div>

          {/* Footer — fixed, always reachable */}
          <div className="shrink-0 border-t border-border bg-panel-raised/60 p-4">{footer}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
