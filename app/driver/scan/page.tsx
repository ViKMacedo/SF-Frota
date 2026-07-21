"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MobileLayout } from "@/components/layout/mobile-layout";
import { QRScanner } from "@/components/driver/qrscanner";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { clearSession } from "@/services/sessionService";
import { syncPendingItems } from "@/services/syncService";

import {
  getVehicleById,
  releaseFromMaintenance,
} from "@/services/vehicleService";
import { getActiveTrip } from "@/services/tripService";
import { getVehicleMaintenanceStatus } from "@/services/maintenanceService";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  MAINTENANCE_KEYS,
  MAINTENANCE_LABELS,
  type MaintenanceKey,
  type Vehicle,
} from "@/lib/db";

import { LogOut, Wrench, X } from "lucide-react";

type PopupStep = "confirm" | "checklist" | null;

export default function DriverScanPage() {
  useAuthGuard("driver");

  const router = useRouter();
  const { toast, showToast, clearToast } = useToast();

  const [popupStep, setPopupStep] = useState<PopupStep>(null);
  const [maintenanceVehicle, setMaintenanceVehicle] = useState<Vehicle | null>(
    null,
  );
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    async function checkActiveTrip() {
      const activeTrip = await getActiveTrip();
      if (activeTrip) router.push("/driver/running");
    }
    checkActiveTrip();
  }, [router]);

  useEffect(() => {
    const handlePageHide = () => {
      // Marca a página como não cacheável no bfcache
      window.onunload = () => {};
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  function closePopup() {
    setPopupStep(null);
    setMaintenanceVehicle(null);
    setCheckedItems({});
  }

  function handleNotReady() {
    showToast("Veículo continua em manutenção", "warning");
    closePopup();
  }

  function handleAlreadyReady() {
    if (!maintenanceVehicle) return;

    const status = getVehicleMaintenanceStatus(maintenanceVehicle);
    const pendingKeys = MAINTENANCE_KEYS.filter((key) => {
      const urgency = status?.[key]?.urgency;
      return urgency === "vencido" || urgency === "proximo";
    });

    if (pendingKeys.length === 0) {
      // Não há nenhum item pendente de manutenção — libera direto
      void finalizeRelease([]);
      return;
    }

    setCheckedItems(
      pendingKeys.reduce(
        (acc, key) => ({ ...acc, [key]: false }),
        {} as Record<string, boolean>,
      ),
    );
    setPopupStep("checklist");
  }

  async function finalizeRelease(completedItems: MaintenanceKey[]) {
    if (!maintenanceVehicle?.id) return;
    setReleasing(true);
    try {
      await releaseFromMaintenance(maintenanceVehicle.id, completedItems);
      syncPendingItems().catch(() => {});
      const vehicleId = maintenanceVehicle.id;
      closePopup();
      router.push(`/driver/start/${vehicleId}`);
    } catch {
      showToast("Erro ao liberar veículo da manutenção", "error");
      closePopup();
    } finally {
      setReleasing(false);
    }
  }

  function handleConfirmChecklist() {
    const completedItems = Object.entries(checkedItems)
      .filter(([, checked]) => checked)
      .map(([key]) => key as MaintenanceKey);
    void finalizeRelease(completedItems);
  }

  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      try {
        const data = JSON.parse(decodedText);
        if (!data.vehicleId) {
          showToast("QR inválido", "error");
          return;
        }

        const vehicle = await getVehicleById(String(data.vehicleId));
        if (!vehicle) {
          showToast("Veículo não encontrado", "error");
          return;
        }
        if (!vehicle.id) {
          showToast("Veículo sem ID, recadastre-o", "error");
          return;
        }

        if (vehicle.status === "Em manutenção") {
          setMaintenanceVehicle(vehicle);
          setPopupStep("confirm");
          return;
        }

        if (vehicle.status !== "Disponível") {
          showToast("Veículo indisponível no momento", "warning");
          return;
        }

        router.push(`/driver/start/${vehicle.id}`);
      } catch {
        showToast("Erro ao ler QR Code", "error");
      }
    },
    [router, showToast],
  );

  return (
    <MobileLayout className="p-4 flex flex-col justify-between min-h-screen">
      <Toast toast={toast} onClose={clearToast} />

      <div>
        {/* Botão Sair / Voltar integrado */}
        <button
          onClick={async () => {
            await clearSession();
            router.replace("/login");
          }}
          aria-label="Sair e voltar ao login"
          className="flex items-center gap-1.5 mb-6 px-3 min-h-11 text-sm font-medium text-zinc-300 bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white active:bg-white/15 rounded-xl transition self-start"
        >
          <LogOut className="h-4.5 w-4.5 text-zinc-400" />
          Sair
        </button>

        {/* Textos de Apoio */}
        <h1 className="text-3xl font-bold text-white mb-1">Escanear QR Code</h1>
        <p className="text-indigo-300 text-sm mb-8">
          Aponte a câmera para o QR Code fixado no veículo.
        </p>

        {/* Container do Scanner modernizado (Translúcido e sutil) */}
        <div className="w-full rounded-3xl overflow-hidden border border-white/5 bg-[#131526]/40 shadow-2xl p-2">
          <div className="rounded-[20px] overflow-hidden">
            <QRScanner onScanSuccess={handleScanSuccess} />
          </div>
        </div>
      </div>

      {/* Espaçador sutil para manter o layout flexível igual às outras telas */}
      <div className="w-full pb-6" />

      {/* Popup: veículo em manutenção — já foi retirado? */}
      {popupStep === "confirm" && maintenanceVehicle && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#131526] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-500/10 p-2.5 rounded-xl text-yellow-400">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base text-zinc-400">
                  {maintenanceVehicle.model} • {maintenanceVehicle.plate}
                </p>
                <p className="text-white font-semibold">Em manutenção</p>
              </div>
            </div>
            <p className="text-zinc-300 text-base mb-6">
              Este veículo está marcado como em manutenção. Ele já foi retirado
              da manutenção e está pronto para uso?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAlreadyReady}
                className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl transition"
              >
                Sim, já saiu da manutenção
              </button>
              <button
                onClick={handleNotReady}
                className="w-full h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 font-medium rounded-2xl transition"
              >
                Não, continua em manutenção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup: checklist de itens realizados */}
      {popupStep === "checklist" && maintenanceVehicle && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#131526] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-semibold">
                Quais itens foram realizados?
              </p>
              <button
                onClick={closePopup}
                aria-label="Fechar"
                className="text-zinc-500 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-zinc-400 text-xs mb-4">
              Marque apenas os itens que foram de fato trocados ou revisados
              nesta manutenção.
            </p>
            <div className="space-y-2 mb-6">
              {Object.keys(checkedItems).map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checkedItems[key]}
                    onChange={(e) =>
                      setCheckedItems((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded accent-green-600"
                  />
                  <span className="text-sm text-white">
                    {MAINTENANCE_LABELS[key as MaintenanceKey]}
                  </span>
                </label>
              ))}
            </div>
            <button
              onClick={handleConfirmChecklist}
              disabled={releasing}
              className="w-full h-12 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-2xl transition"
            >
              {releasing ? "Liberando..." : "Confirmar e liberar veículo"}
            </button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
