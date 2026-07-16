"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MAINTENANCE_KEYS, MAINTENANCE_LABELS, type Vehicle } from "@/lib/db";
import {
  getVehicleMaintenanceStatus,
  registerMaintenanceDone,
} from "@/services/maintenanceService";
import { syncPendingItems } from "@/services/syncService";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

interface MaintenanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle;
  currentKm: number;
  onSuccess?: (vehicle: Vehicle) => void;
}

const URGENCY_DOT: Record<string, string> = {
  vencido: "bg-red-500",
  proximo: "bg-yellow-500",
  "em-dia": "bg-green-500",
  "nao-configurado": "bg-zinc-600",
};

export function MaintenanceModal({
  open,
  onOpenChange,
  vehicle,
  currentKm,
  onSuccess,
}: MaintenanceModalProps) {
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const { toast, showToast, clearToast } = useToast();

  const statuses = getVehicleMaintenanceStatus(vehicle, currentKm);

  async function handleRegister(itemKey: (typeof MAINTENANCE_KEYS)[number]) {
    setSavingKey(itemKey);
    try {
      await registerMaintenanceDone(vehicle.id, itemKey, currentKm);
      await syncPendingItems();
      showToast(
        `${MAINTENANCE_LABELS[itemKey]} registrado com KM ${currentKm.toLocaleString("pt-BR")}`,
        "success",
      );
      const updated = await import("@/lib/db").then((m) =>
        m.db.vehicles.get(vehicle.id),
      );
      if (updated) onSuccess?.(updated);
    } catch {
      showToast("Erro ao registrar manutenção.", "error");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border border-zinc-800 bg-zinc-950 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Registrar manutenção
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Toque no item que foi feito agora. Vai gravar o KM e a data de
              hoje como referência.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {MAINTENANCE_KEYS.map((key) => {
              const status = statuses?.[key];
              return (
                <button
                  key={key}
                  onClick={() => handleRegister(key)}
                  disabled={savingKey !== null}
                  className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-left hover:bg-zinc-800 active:bg-zinc-800/70 transition disabled:opacity-50 min-h-14"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {MAINTENANCE_LABELS[key]}
                    </p>
                    {status && (
                      <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${URGENCY_DOT[status.urgency]}`}
                          aria-hidden="true"
                        />
                        {status.label}
                      </p>
                    )}
                  </div>
                  <span className="text-zinc-500 text-xs">
                    {savingKey === key ? "Salvando..." : "Registrar"}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
      <Toast toast={toast} onClose={clearToast} />
    </>
  );
}
