"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MobileLayout } from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";

import { getLastFinishedTrip } from "@/services/tripService";
import { clearSession } from "@/services/sessionService";
import type { Trip } from "@/lib/db";

export default function DriverSuccessPage() {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    async function loadTrip() {
      const finishedTrip = await getLastFinishedTrip();
      if (!finishedTrip) {
        router.push("/driver/scan");
        return;
      }
      setTrip(finishedTrip);
    }
    loadTrip();
  }, [router]);

  async function handleLogout() {
    await clearSession();
    router.push("/login");
  }

  if (!trip) return null;

  return (
    <MobileLayout className="bg-zinc-950">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-5xl text-green-400 mb-8">
          ✓
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Uso finalizado</h1>
        <p className="text-zinc-400 text-sm mb-10">
          A utilização foi registrada com sucesso.
        </p>

        <div className="w-full rounded-3xl bg-zinc-900 border border-zinc-800 p-5 mb-10 text-left space-y-4">
          {[
            { label: "Veículo", value: trip.vehiclePlate },
            { label: "Motorista", value: trip.driverName },
            { label: "KM rodado", value: `${trip.distance ?? 0} km` },
            { label: "Tempo", value: trip.duration ?? "—" },
            { label: "KM inicial", value: String(trip.startKm) },
            { label: "KM final", value: String(trip.endKm ?? "—") },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">{label}</span>
              <span className="text-white font-semibold text-sm">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={handleLogout}
        variant="secondary"
        className="w-full h-12 rounded-2xl text-base font-semibold"
      >
        Sair
      </Button>
    </MobileLayout>
  );
}
