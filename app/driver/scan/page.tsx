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
      if (activeTrip) {
        router.push("/driver/running");
      }
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
      <main className="min-h-screen bg-gradient-to-b from-indigo-950 to-indigo-900 text-white max-w-sm mx-auto flex flex-col p-6">
        <div className="mb-10">
          <button
            onClick={() => router.back()}
            className="text-sm text-zinc-400 mb-6"
          >
            ← Voltar
          </button>

          <h1 className="text-2xl font-bold">Escanear QR Code</h1>

          <p className="text-zinc-400 mt-2">
            Aponte a câmera para o QR Code do veículo
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 p-2">
            <QRScanner onScanSuccess={handleScanSuccess} />
          </div>
        </div>
      </main>
    </MobileLayout>
  );
}
