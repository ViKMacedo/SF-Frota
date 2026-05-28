"use client";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { getStorage, saveStorage } from "@/lib/storage";

export default function DriverEndPage() {
  const trip = getStorage("trip");
  const initialKm = trip?.initialKm || 0;
  const [finalKm, setFinalKm] = useState("");
  const [error, setError] = useState("");
  function handleValidate() {
    const parsed = Number(finalKm);
    if (!finalKm) {
      setError("Informe o KM final");
      return;
    }

    if (finalKm.length < 5) {
      setError("KM deve ter no mínimo 5 dígitos");
      return;
    }

    if (parsed <= 0) {
      setError("KM deve ser maior que zero");
      return;
    }

    if (parsed <= initialKm) {
      setError(`KM final deve ser maior que ${initialKm}`);
      return;
    }

    setError("");

    saveStorage("trip", {
      ...trip,
      finalKm: parsed,
      endedAt: new Date().toISOString(),
    });

    router.push("/driver/review");
  }
  const router = useRouter();

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
          <h1 className="text-3xl font-bold text-white-900">Finalizar uso</h1>
          <p className="text-white-500 mt-2">
            Informe o KM atual do veículo para finalizar
          </p>
        </div>

        {/* Status Icon */}
        <div className="flex justify-center mb-10">
          <div
            className={`
          w-28 h-28 rounded-full flex items-center justify-center text-4xl
          ${error ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"}
        `}
          >
            🏁
          </div>
        </div>
        {/* Input */}
        <div className="mb-4">
          <label className="text-sm text-white-500 mb-2 block">KM final</label>
          <Input
            value={finalKm}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 6) {
                setFinalKm(value);
              }
            }}
            placeholder="123456"
            type="text"
            inputMode="numeric"
          />
        </div>
        {/* Error */}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {/* Vehicle Info */}
        <div className="text-sm text-white-500">Fiat Palio Fire • ABC-1234</div>
        {/* Button */}
        <div className="mt-auto pt-10">
          <Button
            onClick={handleValidate}
            className="w-full h-14 rounded-2xl text-base font-semibold"
          >
            Confirmar finalização
          </Button>
        </div>
      </main>
    </MobileLayout>
  );
}
