"use client";
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { getStorage } from "@/lib/storage";

export default function DriverRunningPage() {
  const router = useRouter();
  const trip = getStorage("trip");
  const [time, setTime] = useState("00h 00min");
  useEffect(() => {
    function updateTime() {
      if (!trip?.startedAt) return;
      const started = new Date(trip.startedAt);
      const now = new Date();
      const diffMs = now.getTime() - started.getTime();
      const totalMinutes = Math.floor(diffMs / 1000 / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      setTime(formatted);
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [trip]);
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Uso em andamento</h1>
              <p className="text-indigo-300 mt-2">Veículo em uso</p>
            </div>

            <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-medium">
              ● Em andamento
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="rounded-3xl p-6 bg-white text-zinc-900 border-none shadow-2xl">
          <div className="space-y-6">
            {/* KM Inicial */}
            <div>
              <p>KM inicial:</p>
              <h1 className="text-3xl font-bold tracking-tight">
                {trip?.initialKm}
              </h1>
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-200" />

            {/* KM Rodado */}
            <div>
              <p className="text-sm text-zinc-500 mb-2">Tempo percorrido</p>
              <div className="flex items-end gap-2">
                <h4 className="text-3xl font-bold tracking-tight">{time}</h4>
              </div>
            </div>
          </div>
        </Card>

        {/* Vehicle Info */}
        <div className="mt-6 text-sm text-indigo-200">
          Fiat Palio Fire • ABC-1234
        </div>

        {/* Bottom Button */}
        <div className="mt-auto pt-10">
          <Button
            onClick={() => router.push("/driver/end")}
            className="w-full h-12 rounded-2xl text-base font-semibold"
          >
            Confirmar veículo
          </Button>
        </div>
      </main>
    </MobileLayout>
  );
}
