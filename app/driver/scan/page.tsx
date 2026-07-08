"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { MobileLayout } from "@/components/layout/mobile-layout";
import { QRScanner } from "@/components/driver/qrscanner";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { clearSession } from "@/services/sessionService";

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
  useEffect(() => {
    const handlePageHide = () => {
      // Marca a página como não cacheável no bfcache
      window.onunload = () => {};
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

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
        onClick={async () => {
          await clearSession();
          router.replace("/login");
        }}
        aria-label="Voltar e sair"
        className="flex items-center gap-1.5 -ml-1 mb-6 px-3 min-h-11 text-sm font-medium text-indigo-200 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white active:bg-white/15 rounded-xl transition self-start"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Voltar
      </button>

      <h1 className="text-2xl font-bold text-white mb-2">Escanear QR Code</h1>
      <p className="text-indigo-200 text-sm font-medium mb-8">
        Aponte a câmera para o QR Code do veículo
      </p>

      <div className="w-full rounded-3xl overflow-hidden border border-indigo-800 bg-indigo-900/50">
        <QRScanner onScanSuccess={handleScanSuccess} />
      </div>
    </MobileLayout>
  );
}
