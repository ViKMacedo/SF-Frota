"use client";

import { useMemo, useState } from "react";

import { MobileLayout } from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { getStorage } from "@/lib/storage";
import { createTrip, getActiveTrip } from "@/services/tripService";
import { updateVehicleStatus } from "@/services/vehicleService";

export default function DriverStartPage() {
  const [error, setError] = useState("");
  const [initialKm, setInitialKm] = useState("");
  const router = useRouter();

  const vehicle = getStorage("vehicle");
  const driver = useMemo(() => {
    return getStorage("driver");
  }, []);

  async function handleStart() {
    const parsed = Number(initialKm);
    const activeTrip = await getActiveTrip();

    if (activeTrip) {
      router.push("/driver/running");
      return;
    }

    if (!initialKm) {
      setError("Informe o KM inicial");
      return;
    }

    if (isNaN(parsed)) {
      setError("Informe apenas números");
      return;
    }

    if (initialKm.length < 5) {
      setError("KM deve ter no mínimo 5 dígitos");
      return;
    }

    if (parsed <= 0) {
      setError("KM deve ser maior que zero");
      return;
    }

    if (!vehicle) {
      setError("Veículo não encontrado");
      return;
    }

    if (!driver) {
      setError("Motorista não encontrado");
      return;
    }

    setError("");

    await createTrip({
      vehicleId: vehicle.id,
      vehicleModel: vehicle.model,
      vehiclePlate: vehicle.plate,
      driverName: driver.name,
      startKm: parsed,
      startedAt: new Date().toISOString(),
      status: "Em andamento",
      synced: false,
      lat: -24.021347,
      lng: -48.362951,
      driverId: 0,
    });

    await updateVehicleStatus(vehicle.id, "Em uso");

    router.push("/driver/running");
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
          <h1 className="text-3xl font-bold text-white">Iniciar uso</h1>
          <p>Motorista: {driver?.name}</p>
          <p className="text-zinc-300 mt-2">
            Informe o KM atual do veículo para iniciar
          </p>
        </div>

        {/* Vehicle Card */}
        <Card className="rounded-3xl p-5 border-white-200 shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl">
              🚗
            </div>
            <div>
              <p className="text-sm text-zinc-500">Veículo em uso</p>
              <p>{vehicle?.model}</p>
              <p className="text-sm text-zinc-500">{vehicle?.plate}</p>
            </div>
          </div>
        </Card>

        {/* KM Input */}
        <div className="mb-8">
          <label className="text-sm text-zinc-300 mb-2 block">KM inicial</label>
          <Input
            value={initialKm}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 6) {
                setInitialKm(value);
              }
            }}
            placeholder="123456"
            type="text"
            inputMode="numeric"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        {/* Bottom Button */}
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
