"use client";

import { useEffect, useState } from "react";
import { Fuel } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Vehicle } from "@/lib/db";
import { estimateFuelLevel, estimateRangeKm } from "@/services/refuelService";

interface FuelIndicatorCardProps {
  vehicle: Vehicle;
  currentKm: number;
}

export function FuelIndicatorCard({
  vehicle,
  currentKm,
}: FuelIndicatorCardProps) {
  const nivel = estimateFuelLevel(vehicle, currentKm);

  // Começa em 0 e anima até o valor real assim que o card monta/atualiza —
  // só um detalhe visual, não muda o cálculo.
  const [displayNivel, setDisplayNivel] = useState(0);
  useEffect(() => {
    if (nivel === undefined) return;
    const raf = requestAnimationFrame(() => setDisplayNivel(nivel));
    return () => cancelAnimationFrame(raf);
  }, [nivel]);

  if (nivel === undefined) return null;

  const autonomia = estimateRangeKm(vehicle, nivel);
  const isLow = nivel <= 15;
  const barColor = isLow
    ? "bg-red-500"
    : nivel <= 35
      ? "bg-yellow-500"
      : "bg-green-500";
  const iconColor = isLow
    ? "text-red-500"
    : nivel <= 35
      ? "text-yellow-500"
      : "text-green-600";

  return (
    <Card className="rounded-3xl p-4 bg-white text-zinc-900 border-none shadow-2xl mb-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Fuel
          className={`w-3.5 h-3.5 ${iconColor} ${isLow ? "animate-pulse" : ""}`}
        />
        <p
          className="text-base
         text-zinc-500"
        >
          Combustível estimado
        </p>
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-2xl font-bold tracking-tight tabular-nums transition-all duration-700 ease-out">
          {Math.round(displayNivel)}%
        </span>
        {autonomia !== undefined && (
          <span className="text-sm text-zinc-500">
            &middot; ~{autonomia} km de autonomia
          </span>
        )}
      </div>
      <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${barColor}`}
          style={{ width: `${Math.max(4, displayNivel)}%` }}
        />
      </div>
    </Card>
  );
}
