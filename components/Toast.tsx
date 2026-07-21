"use client";

import type { ToastMessage } from "@/hooks/useToast";

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

const STYLES: Record<string, string> = {
  error: "bg-red-500/10 border-red-500/20 text-red-300",
  success: "bg-green-500/10 border-green-500/20 text-green-300",
  warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",
};

const ICONS: Record<string, string> = {
  error: "✕",
  success: "✓",
  warning: "!",
};

export function Toast({ toast, onClose }: ToastProps) {
  const visible = !!toast;
  if (!toast) return null;

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[9999]
        flex items-center gap-3
        px-4 py-3 rounded-2xl border
        text-sm font-medium shadow-xl
        transition-all duration-300
        max-w-[calc(100vw-2rem)] w-max
        ${STYLES[toast.type]}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
      `}
    >
      <span className="shrink-0 font-bold">{ICONS[toast.type]}</span>
      <span>{toast.message}</span>
      <button
        onClick={onClose}
        className="shrink-0 opacity-60 hover:opacity-100 ml-1"
      >
        ✕
      </button>
    </div>
  );
}
