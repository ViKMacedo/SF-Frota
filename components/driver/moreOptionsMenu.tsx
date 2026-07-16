"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MoreOptionsMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefuel: () => void;
  onMaintenance: () => void;
}

export function MoreOptionsMenu({
  open,
  onOpenChange,
  onRefuel,
  onMaintenance,
}: MoreOptionsMenuProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-zinc-800 bg-zinc-950 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Mais opções</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onOpenChange(false);
              onRefuel();
            }}
            className="w-full h-12 rounded-2xl text-xl font-semibold bg-green-500 text-zinc-100 border border-green-500 hover:bg-green-400 transition"
          >
            Abastecer
          </button>

          <button
            onClick={() => {
              onOpenChange(false);
              onMaintenance();
            }}
            className="w-full h-12 rounded-2xl text-xl font-semibold bg-indigo-600 p-2.5 rounded-xl text-indigo-50"
          >
            Manutenção
          </button>

          <button
            disabled
            aria-disabled="true"
            className="w-full h-12 rounded-2xl text-xl font-semibold bg-red-500/40 text-zinc-100 border border-red-500/40 opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
          >
            Ajuda
            <span className="text-xs font-normal">(em breve)</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
