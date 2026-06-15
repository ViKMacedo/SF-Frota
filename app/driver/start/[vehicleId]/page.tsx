"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";

import { MobileLayout } from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { db, type Vehicle } from "@/lib/db";

import { createTrip, getActiveTrip } from "@/services/tripService";
import { getVehicleById, updateVehicleStatus } from "@/services/vehicleService";

export default function DriverStartPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const router = useRouter();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [, setError] = useState("");

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

  async function handleStart() {
    const activeTrip = await getActiveTrip();

    if (activeTrip) {
      router.push("/driver/running");
      return;
    }

    if (!vehicle) {
      setError("Veículo não encontrado");
      return;
    }

    if (!session) {
      setError("Motorista não encontrado");
      return;
    }

    await createTrip({
      vehicleId: vehicle.id!,
      vehicleModel: vehicle.model,
      vehiclePlate: vehicle.plate,
      driverId: session.userId!,
      driverName: session.name,
      startedAt: new Date().toISOString(),
      status: "Em andamento",
      synced: false,
      lat: -24.021347,
      lng: -48.362951,
    });
    await updateVehicleStatus(vehicle.id!, "Em uso");

    router.push("/driver/running");
  }

  if (!vehicle) {
    return (
      <MobileLayout>
        {" "}
        <div className="p-6 text-white">Carregando veículo... </div>{" "}
      </MobileLayout>
    );
  }

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
          <h1 className="text-3xl font-bold text-white">Iniciar uso</h1>
          <p>Motorista: {session?.name}</p>
          <p className="text-zinc-300 mt-2">
            Confirme o veículo para iniciar a utilização
          </p>
        </div>
        <Card className="rounded-3xl p-5 border-white-200 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl">
              🚗
            </div>

            <div>
              <p className="text-sm text-zinc-500">Veículo em uso</p>

              <p>{vehicle.model}</p>

              <p className="text-sm text-zinc-500">{vehicle.plate}</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-3xl p-5 border-white-200 shadow-sm mb-8">
          <p className="text-sm text-zinc-500 mb-2">Odômetro atual</p>

          <p className="text-4xl font-bold">
            {vehicle.km.toLocaleString("pt-BR")}
          </p>

          <p className="text-sm text-zinc-500 mt-2">KM inicial da viagem</p>

          <div className="mt-4 flex items-center gap-2 text-green-500">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Será registrado automaticamente
          </div>

          <p>Último motorista: {vehicle.lastDriver ?? "—"}</p>

          <p>
            Última utilização:
            {vehicle.lastUsedAt
              ? new Date(vehicle.lastUsedAt).toLocaleString("pt-BR")
              : " — "}
          </p>
        </Card>
        <div className="mt-auto">
          <Button
            onClick={handleStart}
            className="w-full h-12 rounded-2xl text-base font-semibold"
          >
            Confirmar veículo
          </Button>
        </div>
      </main>
    </MobileLayout>
  );
}
