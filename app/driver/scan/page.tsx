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

// Ícones do Lucide para padronizar
import { LogOut } from "lucide-react";

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
    </MobileLayout>
  );
}
