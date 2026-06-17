"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { MobileLayout } from "@/components/layout/mobile-layout";
import { QRScanner } from "@/components/driver/qrscanner";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

import { getVehicleById } from "@/services/vehicleService";
import { getActiveTrip } from "@/services/tripService";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function DriverScanPage() {
  useAuthGuard("driver");

  const router = useRouter();
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    async function checkActiveTrip() {
      const activeTrip = await getActiveTrip();
      if (activeTrip) router.push("/driver/running");
    }
    checkActiveTrip();
  }, [router]);

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
        if (vehicle.status !== "Disponível") {
          showToast("Veículo indisponível no momento", "warning");
          return;
        }
        if (!vehicle.id) {
          showToast("Veículo sem ID, recadastre-o", "error");
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
    <MobileLayout>
      <Toast toast={toast} onClose={clearToast} />

      <button
        onClick={() => router.back()}
        className="text-sm text-indigo-300 mb-8 self-start"
      >
        ← Voltar
      </button>

      <h1 className="text-2xl font-bold text-white mb-2">Escanear QR Code</h1>
      <p className="text-indigo-300 text-sm mb-8">
        Aponte a câmera para o QR Code do veículo
      </p>

      <div className="w-full rounded-3xl overflow-hidden border border-indigo-800 bg-indigo-900/50">
        <QRScanner onScanSuccess={handleScanSuccess} />
      </div>
    </MobileLayout>
  );
}
