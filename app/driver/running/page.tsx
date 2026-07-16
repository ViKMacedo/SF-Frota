"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { getActiveTrip } from "@/services/tripService";
import { getVehicleById } from "@/services/vehicleService";
import { getSession } from "@/services/sessionService";
import { db, type Trip, type RoutePoint, type Vehicle } from "@/lib/db";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { TRACKING_STATUS, type TrackingStatus } from "@/constants/tracking";
import { queueTripPositionUpdate } from "@/services/syncQueueService";
import { syncPendingItems } from "@/services/syncService";
import { RefuelModal } from "@/components/driver/refuelModal";
import { FuelIndicatorCard } from "@/components/driver/fuelIndicatorCard";
import { MoreOptionsMenu } from "@/components/driver/moreOptionsMenu";
import { MaintenanceModal } from "@/components/driver/maintenanceModal";

// Ícones do Lucide para bater com o Mock
import {
  Gauge,
  Clock,
  MapPin,
  Fuel,
  AlertTriangle,
  ChevronRight,
  Flag,
} from "lucide-react";

const MIN_POINT_INTERVAL_MS = 5000;

const GPS_ERROR_MESSAGES: Record<
  number,
  { title: string; instructions: string }
> = {
  1: {
    title: "Permissão de localização negada",
    instructions:
      "Para continuar, habilite a localização para este site nas configurações do seu navegador e recarregue a página.",
  },
  2: {
    title: "Sinal GPS indisponível",
    instructions:
      "Não foi possível obter sua posição. Tente ir para um local com melhor sinal ou ao ar livre.",
  },
  3: {
    title: "GPS demorou demais",
    instructions:
      "O GPS não respondeu a tempo. Verifique se a localização está ativada no dispositivo e tente novamente.",
  },
};

type GpsError = { code: number; title: string; instructions: string } | null;

export default function DriverRunningPage() {
  useAuthGuard("driver");
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [session, setSession] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [refuelOpen, setRefuelOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [time, setTime] = useState("00:00");
  const [speed, setSpeed] = useState(0);
  const [statusLabel, setStatusLabel] = useState<TrackingStatus>(
    TRACKING_STATUS.STOPPED,
  );
  const [gpsError, setGpsError] = useState<GpsError>(null);

  const accelRef = useRef<number>(0);
  const lastPointTsRef = useRef<number>(0);

  useEffect(() => {
    async function loadTrip() {
      const activeTrip = await getActiveTrip();
      if (!activeTrip) {
        router.push("/driver/scan");
        return;
      }
      setTrip(activeTrip);
      const [v, s] = await Promise.all([
        getVehicleById(activeTrip.vehicleId),
        getSession(),
      ]);
      setVehicle(v ?? null);
      if (s) setSession({ userId: s.userId, name: s.name });
    }
    loadTrip();
  }, [router]);

  useEffect(() => {
    function updateTime() {
      if (!trip?.startedAt) return;
      const diffMs = Date.now() - new Date(trip.startedAt).getTime();
      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setTime(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
      );
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [trip]);

  useEffect(() => {
    if (!trip?.id) return;
    function handleMotion(e: DeviceMotionEvent) {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      accelRef.current =
        Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2) - 9.8;
    }
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof (
        DeviceMotionEvent as unknown as {
          requestPermission?: () => Promise<string>;
        }
      ).requestPermission === "function"
    ) {
      (
        DeviceMotionEvent as unknown as {
          requestPermission: () => Promise<string>;
        }
      )
        .requestPermission()
        .then((perm) => {
          if (perm === "granted")
            window.addEventListener("devicemotion", handleMotion);
        })
        .catch(console.warn);
    } else {
      window.addEventListener("devicemotion", handleMotion);
    }
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [trip?.id]);

  useEffect(() => {
    if (!trip?.id) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGpsError(null);
        const {
          latitude,
          longitude,
          speed: rawSpeed,
          heading,
          accuracy,
        } = position.coords;
        const kmh = rawSpeed != null ? Math.round(rawSpeed * 3.6) : 0;
        const accel = accelRef.current;
        const label =
          kmh > 5 ? TRACKING_STATUS.EN_ROUTE : TRACKING_STATUS.STOPPED;

        setSpeed(kmh);
        setStatusLabel(label);
        const now = Date.now();
        if (now - lastPointTsRef.current < MIN_POINT_INTERVAL_MS) return;
        lastPointTsRef.current = now;
        const newPoint: RoutePoint = {
          lat: latitude,
          lng: longitude,
          speed: kmh,
          heading: heading ?? undefined,
          accuracy: accuracy ?? undefined,
          ts: now,
          accel,
        };
        db.trips.get(trip.id!).then(async (current) => {
          if (!current) return;
          const changes = {
            lat: latitude,
            lng: longitude,
            speed: kmh,
            statusLabel: label,
            route: [...(current.route ?? []), newPoint],
          };
          const updated: Trip = { ...current, ...changes };

          try {
            await db.trips.update(trip.id!, changes);
            await queueTripPositionUpdate(updated);
          } catch (e) {
            console.error(e);
            return;
          }

          try {
            await syncPendingItems();
          } catch (e) {
            console.error(e);
          }
        });
      },
      (err) => {
        const info = GPS_ERROR_MESSAGES[err.code] ?? {
          title: "Erro de GPS",
          instructions: err.message,
        };
        setGpsError({ code: err.code, ...info });
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [trip?.id]);

  const statusColor =
    statusLabel === TRACKING_STATUS.STOPPED
      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";

  if (gpsError) {
    return (
      <MobileLayout>
        <button
          onClick={() => router.back()}
          className="text-sm text-zinc-400 mb-8 self-start"
        >
          ← Voltar
        </button>
        {/* ... manter tela de erro intocada ... */}
      </MobileLayout>
    );
  }

  return (
    <MobileLayout className="p-4 flex flex-col justify-between min-h-screen">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-indigo-300 hover:text-white transition-colors"
          >
            ← Voltar
          </button>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${statusColor}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {statusLabel === TRACKING_STATUS.STOPPED ? "Parado" : "Em rota"}
          </span>
        </div>

        {/* Info do veículo */}
        <h1 className="text-3xl font-bold text-white mb-1">Uso em andamento</h1>
        <p className="text-indigo-300 text-sm mb-8">
          {trip?.vehicleModel} • {trip?.vehiclePlate}
        </p>

        {/* Card de Combustível */}
        {vehicle?.capacidadeTanqueL && trip && (
          <div className="mb-4">
            <FuelIndicatorCard vehicle={vehicle} currentKm={trip.startKm} />
          </div>
        )}

        {/* Card de Métricas Unificado do Mock */}
        <Card className="rounded-3xl p-6 bg-[#131526]/40 border border-white/5 shadow-2xl mb-4 text-white">
          <div className="grid grid-cols-2 gap-y-6">
            {/* Velocidade Atual */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Gauge className="h-4 w-4 text-emerald-500" />
                Velocidade atual
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-4xl font-bold tracking-tight">{speed}</p>
                <span className="text-zinc-400 text-sm">km/h</span>
              </div>
            </div>

            {/* Tempo em uso */}
            <div className="space-y-1 pl-6 border-l border-white/10">
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Clock className="h-4 w-4 text-blue-500" />
                Tempo em uso
              </div>
              <p className="text-4xl font-bold tracking-tight">{time}</p>
            </div>

            {/* Divisor Horizontal do Mock */}
            <div className="col-span-2 border-t border-white/10 my-1" />

            {/* KM Inicial */}
            <div className="col-span-2 space-y-1">
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <MapPin className="h-4 w-4 text-purple-500" />
                KM inicial
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-4xl font-bold tracking-tight">
                  {trip?.startKm?.toLocaleString("pt-BR")}
                </p>
                <span className="text-zinc-400 text-sm">KM</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Grid de Abastecimento e Emergência */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setRefuelOpen(true)}
            className="flex items-center gap-3 p-4 bg-[#0C221F]/70 hover:bg-[#12332F]/70 border border-emerald-500/20 rounded-2xl text-left transition-colors"
          >
            <div className="bg-[#123E33] p-2.5 rounded-xl text-emerald-400">
              <Fuel className="h-5 w-5" />
            </div>
            <div>
              <p className="text-md font-bold text-white leading-tight">
                Abastecimento
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              /* lógica de emergência */
            }}
            className="flex items-center gap-3 p-4 bg-[#251218]/70 hover:bg-[#381B24]/70 border border-red-500/20 rounded-2xl text-left transition-colors"
          >
            <div className="bg-[#441924] p-2.5 rounded-xl text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-md font-bold text-white leading-tight">
                Ajuda
              </p>
            </div>
          </button>
        </div>

        {/* Botão Mais Opções */}
        {vehicle && session && (
          <button
            onClick={() => setMoreOptionsOpen(true)}
            className="w-full flex items-center justify-between p-4 bg-[#131526]/40 hover:bg-[#1C1E36]/40 border border-white/5 rounded-2xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 p-2.5 rounded-full text-indigo-400">
                <span className="text-lg font-bold">•••</span>
              </div>
              <div>
                <p className="text-md font-bold text-white">Mais opções</p>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Ver todas as opções disponíveis
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-zinc-500" />
          </button>
        )}
      </div>

      {/* Botão Finalizar Fixo no Rodapé */}
      <div className="w-full pt-6 mt-8 border-t border-white/5">
        <Button
          onClick={() => router.push("/driver/end")}
          className="w-full h-14 bg-zinc-900 border border-white/10 hover:bg-zinc-850 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          <Flag className="h-5 w-5" />
          Finalizar uso
        </Button>
      </div>

      {/* Modais */}
      {vehicle && session && (
        <MoreOptionsMenu
          open={moreOptionsOpen}
          onOpenChange={setMoreOptionsOpen}
          onRefuel={() => setRefuelOpen(true)}
          onMaintenance={() => setMaintenanceOpen(true)}
        />
      )}

      {vehicle && session && trip && (
        <RefuelModal
          open={refuelOpen}
          onOpenChange={setRefuelOpen}
          vehicle={vehicle}
          currentKm={trip.startKm}
          driverId={session.userId}
          driverName={session.name}
          tripId={trip.id}
          onSuccess={(novoNivel, kmAbastecido) =>
            setVehicle((prev) =>
              prev
                ? {
                    ...prev,
                    nivelCombustivelEstimado: novoNivel,
                    ultimoAbastecimentoKm: kmAbastecido,
                  }
                : prev,
            )
          }
        />
      )}

      {vehicle && trip && (
        <MaintenanceModal
          open={maintenanceOpen}
          onOpenChange={setMaintenanceOpen}
          vehicle={vehicle}
          currentKm={trip.startKm}
          onSuccess={(updatedVehicle) => setVehicle(updatedVehicle)}
        />
      )}
    </MobileLayout>
  );
}
