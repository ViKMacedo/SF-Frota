"use client";

import { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      {/* Modal */}
      <div
        className="
          relative z-10
          w-full max-w-lg
          max-h-[85vh]
          rounded-3xl
          border border-zinc-800
          bg-zinc-950
          shadow-2xl
          flex flex-col
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 shrink-0">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="
              text-zinc-500
              hover:text-white
              transition
            "
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
