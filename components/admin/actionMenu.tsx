"use client";

import { useEffect, useRef } from "react";

interface ActionMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onQr?: () => void;
}

export function ActionMenu({
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  onQr,
}: ActionMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="px-3 py-1 rounded-xl hover:bg-zinc-800 transition active:scale-95 text-zinc-400 hover:text-white"
      >
        •••
      </button>

      {isOpen && (
        <div className="absolute right-0 top-9 z-[999] w-44 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
          <button
            onClick={() => {
              onEdit();
              onToggle();
            }}
            className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-800 transition flex items-center gap-2 whitespace-nowrap"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Editar
          </button>

          {onQr && (
            <button
              onClick={() => {
                onQr();
                onToggle();
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-800 transition flex items-center gap-2 whitespace-nowrap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3" />
              </svg>
              QR Code
            </button>
          )}

          <button
            onClick={() => {
              onDelete();
              onToggle();
            }}
            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 transition flex items-center gap-2 whitespace-nowrap"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}
