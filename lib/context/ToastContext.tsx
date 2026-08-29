// lib/context/ToastContext.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, Info, X, LucideIcon } from "lucide-react"; // CheckCircle2 এর বদলে CheckCircle এবং LucideIcon টাইপ আনা হলো

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "bg-emerald-600/95 border-emerald-400/50",
  error: "bg-red-600/95 border-red-400/50",
  info: "bg-slate-800/95 border-slate-600/50",
};

// typeof Info এর বদলে সরাসরি LucideIcon টাইপ ব্যবহার করা হলো
const VARIANT_ICON: Record<ToastVariant, LucideIcon> = {
  success: CheckCircle, 
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      counterRef.current += 1;
      const id = `toast_${Date.now()}_${counterRef.current}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = VARIANT_ICON[toast.variant];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                className={`pointer-events-auto flex items-start gap-3 text-white text-sm font-medium px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-sm ${VARIANT_STYLES[toast.variant]}`}
              >
                <Icon size={18} className="shrink-0 mt-0.5" />
                <span className="flex-1">{toast.message}</span>
                <button
                  onClick={() => dismiss(toast.id)}
                  className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                  aria-label="Dismiss"
                >
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}