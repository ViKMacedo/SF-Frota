"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";

import { MobileLayout } from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { db, type Vehicle } from "@/lib/db";
import { createTrip, getActiveTrip } from "@/services/tripService";
import { getVehicleById } from "@/services/vehicleService";

export default function DriverStartPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const session = useLiveQuery(() => db.sessions.get("current"), []);

  useEffect(() => {
    async function loadVehicle() {
      const { vehicleId } = await params;
      const data = await getVehicleById(vehicleId);
      if (!data) {
        router.push("/driver/scan");
        return;
      }
      setVehicle(data);
    }
    loadVehicle();
  }, [params, router]);
  function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  }

  async function handleStart() {
    const activeTrip = await getActiveTrip();

    if (activeTrip) {
      router.push("/driver/running");
      return;
    }

    if (!vehicle || !session) return;

    const position = await getCurrentPosition();

    await createTrip({
      vehicleId: vehicle.id!,
      vehicleModel: vehicle.model,
      vehiclePlate: vehicle.plate,
      driverId: session.userId!,
      driverName: session.name,
      startedAt: new Date().toISOString(),
      status: "Em andamento",
      synced: false,

      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });

    router.push("/driver/running");
  }

  if (!vehicle) {
    return (
      <MobileLayout>
        <p className="text-indigo-300 text-sm">Carregando veículo...</p>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <button
        onClick={() => router.back()}
        className="text-sm text-indigo-300 mb-8 self-start"
      >
        ← Voltar
      </button>

      <h1 className="text-3xl font-bold text-white mb-2">Iniciar uso</h1>
      <p className="text-indigo-300 text-sm mb-8">
        Confirme o veículo para iniciar a utilização
      </p>

      <Card className="rounded-3xl p-5 border-indigo-800 bg-indigo-900/90 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-700 flex items-center justify-center text-2xl">
            🚗
          </div>
          <div>
            <p className="text-xs text-indigo-200 mb-1">Veículo selecionado</p>
            <p className="text-white font-semibold">{vehicle.model}</p>
            <p className="text-xs text-indigo-300">{vehicle.plate}</p>
          </div>
        </div>
      </Card>

      <Card className="rounded-3xl p-5 border-indigo-800 bg-indigo-900/90 mb-8">
        <p className="text-xs text-indigo-300 mb-1">Odômetro atual</p>
        <p className="text-4xl font-bold text-white">
          {vehicle.km.toLocaleString("pt-BR")}
        </p>
        <p className="text-xs text-indigo-300 mt-1">KM inicial da viagem</p>
        <div className="mt-3 flex items-center gap-2 text-green-400 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          Será registrado automaticamente
        </div>
        {vehicle.lastDriver && (
          <p className="text-xs text-indigo-400 mt-2">
            Último motorista: {vehicle.lastDriver}
          </p>
        )}
      </Card>

      <div className="mt-auto">
        <Button
          onClick={handleStart}
          className="w-full h-12 rounded-2xl text-base font-semibold"
        >
          Confirmar e iniciar
        </Button>
      </div>
    </MobileLayout>
  );
}
