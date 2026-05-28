"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getLastFinishedTrip } from "@/services/tripService";
import type { Trip } from "@/lib/db";

export default function DriverSuccessPage() {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    async function loadTrip() {
      const finishedTrip = await getLastFinishedTrip();
      if (!finishedTrip) {
        router.push("/driver/start");
        return;
      }
      setTrip(finishedTrip);
    }
    loadTrip();
  }, [router]);

  if (!trip) {
    return null;
  }

  const totalKm = trip.distance || 0;
  const formattedTime = trip.duration || "00h 00min";

  return (
    <main className="min-h-screen bg-zinc-950 max-w-sm mx-auto flex flex-col items-center justify-center p-6 text-center text-white">
      {/* Success Icon */}
      <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center text-5xl text-green-600 mb-10">
        ✓
      </div>
      {/* Title */}
      <h1 className="text-3xl font-bold mb-3">Uso finalizado</h1>
      {/* Description */}
      <p className="text-zinc-400 mb-10 max-w-xs">
        A utilização do veículo foi registrada com sucesso.
      </p>
      {/* Summary */}
      <div className="w-full rounded-3xl bg-zinc-900 border border-zinc-800 p-6 mb-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-zinc-400">Veículo</span>
          <span className="font-semibold">{trip.vehiclePlate}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-zinc-400">KM rodado</span>
          <span className="font-semibold">{totalKm} km</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Tempo</span>
          <span className="font-semibold">{formattedTime}</span>
        </div>
      </div>

      {/* Button */}
      <Button
        onClick={() => router.push("/login")}
        className="w-full h-12 rounded-2xl text-base font-semibold"
      >
        Voltar ao início
      </Button>
    </main>
  );
}
