"use client";

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
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="px-3 py-1 rounded-xl hover:bg-zinc-800 transition active:scale-95"
      >
        •••
      </button>

      {isOpen && (
        <div
          className="
            absolute
            right-0
            top-10
            z-[999] 
            w-40
            rounded-2xl
            border border-zinc-800
            bg-zinc-900
            shadow-2xl
            overflow-hidden
          "
        >
          <button
            onClick={() => {
              onEdit();
              onToggle();
            }}
            className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition"
          >
            Editar
          </button>
          <button
            onClick={() => {
              onDelete();
              onToggle();
            }}
            className="w-full text-left px-4 py-3 text-red-400 hover:bg-zinc-800 transition"
          >
            Excluir
          </button>
          {onQr && (
            <button
              onClick={onQr}
              className="w-full text-left px-4 py-2 hover:bg-zinc-800"
            >
              {" "}
              QR Code{" "}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
