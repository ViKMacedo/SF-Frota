"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { MobileLayout } from "@/components/layout/mobile-layout";
import { QRScanner } from "@/components/driver/qrscanner";

import { getVehicleById } from "@/services/vehicleService";
import { getActiveTrip } from "@/services/tripService";

import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function DriverScanPage() {
  useAuthGuard("driver");

  const router = useRouter();

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
          alert("QR inválido");
          return;
        }

        const vehicle = await getVehicleById(String(data.vehicleId));

        if (!vehicle) {
          alert("Veículo não encontrado");
          return;
        }

        if (vehicle.status !== "Disponível") {
          alert("Veículo indisponível");
          return;
        }

        if (!vehicle.id) {
          alert("Veículo sem ID, recadastre-o");
          return;
        }
        router.push(`/driver/start/${vehicle.id}`);
      } catch {
        alert("Erro ao ler QR Code");
      }
    },
    [router],
  );

  return (
    <MobileLayout>
      {" "}
      <main className="min-h-screen bg-gradient-to-b from-indigo-950 to-indigo-900 text-white max-w-sm mx-auto flex flex-col p-6">
        {" "}
        <div className="mb-10">
          <button
            onClick={() => router.back()}
            className="text-sm text-zinc-400 mb-6"
          >
            ← Voltar{" "}
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
