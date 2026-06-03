"use client";

import { getStorage } from "@/lib/storage";

import { MobileLayout } from "@/components/layout/mobile-layout";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function DriverReviewPage() {
  useAuthGuard("driver");
  const router = useRouter();
  const trip = getStorage("trip");
  const totalKm = (trip?.finalKm || 0) - (trip?.initialKm || 0);
  const startedAt = new Date(trip?.startedAt || "");
  const endedAt = new Date(trip?.endedAt || "");
  const diffMs = endedAt.getTime() - startedAt.getTime();
  const totalMinutes = Math.floor(diffMs / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const formattedTime = `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}min`;

  return (
    <MobileLayout>
      <main className="min-h-screen bg-gradient-to-b from-indigo-950 to-indigo-900 text-white max-w-sm mx-auto flex flex-col p-6">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => router.back()}
            className="text-sm text-zinc-400 mb-6"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold">Revisar uso</h1>
          <p className="text-zinc-400 mt-2">
            Confira as informações antes de finalizar
          </p>
        </div>

        {/* Summary */}
        <Card className="rounded-3xl p-6 bg-zinc-900 border-zinc-800 text-white">
          <div className="space-y-6">
            {/* Vehicle */}
            <div>
              <p className="text-sm text-zinc-400 mb-1">Veículo</p>
              <h2 className="font-bold text-lg">Fiat Palio Fire</h2>
              <p className="text-sm text-zinc-400">ABC-1234</p>
            </div>
            <div className="border-t border-zinc-800" />
            {/* Initial */}
            <div className="flex items-center justify-between">
              <p className="text-zinc-400">KM inicial</p>
              <span className="font-semibold">{trip?.initialKm}</span>
            </div>

            {/* Final */}
            <div className="flex items-center justify-between">
              <p className="text-zinc-400">KM final</p>
              <span className="font-semibold">{trip?.finalKm}</span>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between">
              <p className="text-zinc-400">Total percorrido</p>
              <span className="text-2xl font-bold text-indigo-400">
                {totalKm} km
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-zinc-400">Tempo percorrido</p>
              <span className="text-2xl font-bold text-indigo-400">
                {formattedTime}
              </span>
            </div>
          </div>
        </Card>

        {/* Bottom */}
        <div className="mt-auto pt-10">
          <Button
            onClick={() => router.push("/driver/success")}
            className="w-full h-14 rounded-2xl text-base font-semibold"
          >
            Confirmar finalização
          </Button>
        </div>
      </main>
    </MobileLayout>
  );
}
