"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { getActiveTrip } from "@/services/tripService";
import { db, type Trip } from "@/lib/db";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function DriverRunningPage() {
  useAuthGuard("driver");
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [time, setTime] = useState("00:00");

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

  useEffect(() => {
    if (!trip?.id) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        db.trips.update(trip.id!, {
          lat: latitude,
          lng: longitude,
          speed: speed ? Math.round(speed * 3.6) : 0, // m/s → km/h
        });
      },
      (error) => {
        console.error("Erro GPS:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [trip?.id]);

  useEffect(() => {
    function updateTime() {
      if (!trip?.startedAt) return;
      const started = new Date(trip.startedAt);
      const now = new Date();
      const diffMs = now.getTime() - started.getTime();
      const totalMinutes = Math.floor(diffMs / 1000 / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const formatted =
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}`;
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
              <p className="text-sm text-zinc-500 mb-2">KM inicial</p>
              <h1 className="text-3xl font-bold tracking-tight">
                {trip?.startKm}
              </h1>
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-200" />
            {/* Tempo */}
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
          {trip?.vehicleModel} • {trip?.vehiclePlate}
        </div>

        {/* Bottom Button */}
        <div className="mt-auto pt-10">
          <Button
            onClick={() => router.push("/driver/end")}
            className="w-full h-12 rounded-2xl text-base font-semibold"
          >
            Encerrar utilização
          </Button>
        </div>
      </main>
    </MobileLayout>
  );
}
