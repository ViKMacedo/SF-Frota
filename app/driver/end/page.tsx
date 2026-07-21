"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MobileLayout } from "@/components/layout/mobile-layout";

import { finishTrip, getActiveTrip } from "@/services/tripService";
import type { Trip } from "@/lib/db";

// Ícones do Lucide para bater com o Mock moderno
import {
  Car,
  MapPin,
  Clock,
  Calendar,
  Flag,
  Navigation,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export default function DriverEndPage() {
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [endKm, setEndKm] = useState("");
  const [error, setError] = useState("");
  const [useTime, setUseTime] = useState("00:00");
  const [startTimeLabel, setStartTimeLabel] = useState("");

  useEffect(() => {
    async function loadTrip() {
      const activeTrip = await getActiveTrip();

      if (!activeTrip) {
        router.push("/driver/start");
        return;
      }
      setTrip(activeTrip);

      // Calcular tempo de uso decorrido
      const startedAt = new Date(activeTrip.startedAt);
      const diffMs = Date.now() - startedAt.getTime();
      const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setUseTime(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
      );

      // Formatar início da utilização (ex: 08:42)
      setStartTimeLabel(
        startedAt.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }

    loadTrip();
  }, [router]);

  async function handleFinishTrip(sendToMaintenance = false) {
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
    if (parsed - trip.startKm > 2000) {
      setError("Verifique o KM informado. Distância muito alta.");
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

    await finishTrip(
      trip.id,
      {
        endKm: parsed,
        distance,
        endedAt: endedAt.toISOString(),
        duration,
        status: "Finalizada",
        synced: false,
      },
      sendToMaintenance ? "Em manutenção" : "Disponível",
    );
    router.push("/driver/success");
  }

  const parsedEndKm = Number(endKm);
  const distanceCalculated =
    trip && endKm && parsedEndKm > trip.startKm
      ? parsedEndKm - trip.startKm
      : 0;

  return (
    <MobileLayout className="p-4 flex flex-col justify-between min-h-screen">
      <div>
        {/* Botão Voltar */}
        <button
          onClick={() => router.back()}
          aria-label="Voltar"
          className="flex items-center gap-1.5 -ml-1 mb-6 px-3 min-h-11 text-sm font-medium text-indigo-200 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white active:bg-white/15 rounded-xl transition self-start"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>

        <h1 className="text-3xl font-bold text-white mb-1">
          Encerrar utilização
        </h1>
        <p className="text-indigo-300 text-sm mb-6">
          Confira os dados antes de finalizar.
        </p>

        {/* Card Principal: Informações Unificadas da Corrida */}
        <Card className="rounded-3xl p-5 bg-[#131526]/40 border border-white/5 shadow-2xl mb-5 text-white">
          {/* Veículo Header */}
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-snug">
                {trip?.vehicleModel}
              </h2>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">
                {trip?.vehiclePlate}
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 my-4" />

          {/* Grid de Informações de Uso */}
          <div className="grid grid-cols-2 gap-y-4">
            {/* KM Inicial */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                KM Inicial
              </div>
              <p className="text-xl font-bold tracking-tight">
                {trip?.startKm?.toLocaleString("pt-BR")}{" "}
                <span className="text-xl font-normal text-zinc-400">KM</span>
              </p>
            </div>

            {/* Início da Utilização */}
            <div className="space-y-1 pl-4 border-l border-white/10 gap-3">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs uppercase tracking-wider">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                Início
              </div>
              <p className="text-xl font-bold tracking-tight">
                {startTimeLabel}
              </p>
            </div>

            {/* Tempo de Uso */}
            <div className="col-span-2 border-t border-white/10 my-1" />

            <div className="col-span-2 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                Tempo de uso
              </div>
              <p className="text-xl font-bold tracking-tight">
                {useTime}{" "}
                <span className="text-xs font-normal text-zinc-400">h</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Input de KM Final estilizado igual ao Mock */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-white mb-2 block">
            KM final
          </label>
          <div className="relative flex items-center">
            <Flag className="absolute left-4 h-5 w-5 text-indigo-400 pointer-events-none" />
            <Input
              value={endKm}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 6) {
                  setEndKm(value);
                }
              }}
              placeholder="0"
              type="text"
              inputMode="numeric"
              className="w-full h-14 pl-12 pr-12 bg-transparent border-2 border-indigo-500/30 focus:border-indigo-500 rounded-2xl text-lg font-bold text-white placeholder-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
            />
            <span className="absolute right-4 text-sm text-zinc-500 font-medium">
              km
            </span>
          </div>
          <p className="text-base text-zinc-400 mt-1.5 pl-1">
            Informe o odômetro atual do veículo
          </p>
          {error && <p className="text-red-500 mt-2 font-medium">{error}</p>}
        </div>

        {/* Cards de Comparativo de Distância Real do Mock */}
        {distanceCalculated > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Card de KM Percorrido */}
            <Card className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/20 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2.5 rounded-xl text-emerald-400">
                  <Navigation className="h-5 w-5" />
                </div>
                <div className="gap-3">
                  <p className="text-sm text-zinc-400">Percorrido</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {distanceCalculated} km
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Valores compatíveis
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Botão de Finalização no Rodapé */}
      <div className="flex flex-col gap-3 border-t border-white/5">
        <Button
          onClick={() => handleFinishTrip(false)}
          className="w-full h-14 bg-green-600 border border-white/10 hover:bg-zinc-850 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          <Flag className="h-5 w-5" />
          Finalizar utilização
        </Button>

        <Button
          variant="outline"
          onClick={() => handleFinishTrip(true)}
          className="w-full h-14 bg-yellow-900 border border-white/10 hover:bg-zinc-850 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          <ShieldAlert className="h-5 w-5" />
          Finalizar e colocar em manutenção
        </Button>
      </div>
    </MobileLayout>
  );
}
