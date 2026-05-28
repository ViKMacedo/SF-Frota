"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { finishTrip, getActiveTrip } from "@/services/tripService";
import type { Trip } from "@/lib/db";
import { updateVehicleStatus } from "@/services/vehicleService";

export default function DriverEndPage() {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [endKm, setEndKm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTrip() {
      const activeTrip = await getActiveTrip();
      if (!activeTrip) {
        router.push("/driver/start");
        return;
      }
      setTrip(activeTrip);
    }

    loadTrip();
  }, [router]);

  async function handleFinishTrip() {
    if (!trip?.id) return;
    const parsed = Number(endKm);

    if (!endKm) {
      setError("Informe o KM final");
      return;
    }

    if (isNaN(parsed)) {
      setError("Informe apenas números");
      return;
    }

    if (parsed <= trip.startKm) {
      setError("KM final deve ser maior que o KM inicial");
      return;
    }

    setError("");

    const endedAt = new Date();
    const startedAt = new Date(trip.startedAt);
    const diffMs = endedAt.getTime() - startedAt.getTime();
    const totalMinutes = Math.floor(diffMs / 1000 / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const duration =
      `${String(hours).padStart(2, "0")}h ` +
      `${String(minutes).padStart(2, "0")}min`;

    const distance = parsed - trip.startKm;

    await finishTrip(trip.id, {
      endKm: parsed,
      distance,
      endedAt: endedAt.toISOString(),
      duration,
      status: "Finalizada",
      synced: false,
    });
    await updateVehicleStatus(trip.vehicleId, "Disponível");
    router.push("/driver/success");
  }

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

          <h1 className="text-3xl font-bold">Encerrar utilização</h1>
          <p className="text-indigo-300 mt-2">Informe o KM final do veículo</p>
        </div>

        {/* Vehicle Card */}
        <Card className="rounded-3xl p-6 bg-white text-zinc-900 border-none shadow-2xl">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-500">Veículo</p>
              <h2 className="font-bold text-lg">{trip?.vehicleModel}</h2>
              <p className="text-sm text-zinc-500">{trip?.vehiclePlate}</p>
            </div>
            <div className="border-t border-zinc-200" />

            <div>
              <p className="text-sm text-zinc-500 mb-2">KM inicial</p>
              <h1 className="text-2xl font-bold">{trip?.startKm}</h1>
            </div>
          </div>
        </Card>
        {/* KM Input */}
        <div className="mt-8">
          <label className="text-sm text-zinc-300 mb-2 block">KM final</label>
          <Input
            value={endKm}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");

              if (value.length <= 6) {
                setEndKm(value);
              }
            }}
            placeholder="123456"
            type="text"
            inputMode="numeric"
          />

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* Button */}
        <div className="mt-auto pt-10">
          <Button
            onClick={handleFinishTrip}
            className="w-full h-12 rounded-2xl text-base font-semibold"
          >
            Finalizar utilização
          </Button>
        </div>
      </main>
    </MobileLayout>
  );
}
