"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LicenseWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverLicense: string;
  requiredCategory: string;
  onConfirm: () => void;
}

export function LicenseWarningDialog({
  open,
  onOpenChange,
  driverLicense,
  requiredCategory,
  onConfirm,
}: LicenseWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-yellow-500/20 bg-zinc-950 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">
            CNH pode não ser suficiente
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Sua CNH é categoria{" "}
            <strong className="text-zinc-200">{driverLicense}</strong>, mas este
            veículo normalmente exige categoria{" "}
            <strong className="text-zinc-200">{requiredCategory}</strong>. Você
            pode continuar, mas confirme com o responsável se está autorizado a
            dirigir esse veículo.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            className="bg-yellow-500 text-zinc-950 hover:bg-yellow-400 font-semibold"
          >
            Continuar mesmo assim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
