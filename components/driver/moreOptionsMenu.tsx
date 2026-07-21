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
  onHelp: () => void;
}

export function MoreOptionsMenu({
  open,
  onOpenChange,
  onRefuel,
  onMaintenance,
  onHelp,
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
            className="w-full h-12 rounded-2xl text-xl font-semibold bg-green-500 p-2.5 rounded-xl text-green-50"
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
            onClick={() => {
              onOpenChange(false);
              onHelp();
            }}
            className="w-full h-12 rounded-2xl text-xl font-semibold bg-red-600 p-2.5 rounded-xl text-red-50"
          >
            Ajuda
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
