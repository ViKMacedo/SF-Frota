"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { getActiveTrip } from "@/services/tripService";
import { db, type Trip, type RoutePoint } from "@/lib/db";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { TRACKING_STATUS, type TrackingStatus } from "@/constants/tracking";

// Intervalo mínimo entre pontos gravados (ms)
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
  const [time, setTime] = useState("00:00");
  const [speed, setSpeed] = useState(0);
  const [statusLabel, setStatusLabel] = useState<TrackingStatus>(
    TRACKING_STATUS.STOPPED,
  );
  const [gpsError, setGpsError] = useState<GpsError>(null);

  // Acelerômetro — ref para não precisar re-registrar o listener do GPS
  const accelRef = useRef<number>(0); // m/s² resultante
  const lastPointTsRef = useRef<number>(0);

  // ── Carrega viagem ────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadTrip() {
      const activeTrip = await getActiveTrip();
      if (!activeTrip) {
        router.push("/driver/scan");
        return;
      }
      setTrip(activeTrip);
    }
    loadTrip();
  }, [router]);

  // ── Cronômetro ────────────────────────────────────────────────────────────
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

  // ── Acelerômetro ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!trip?.id) return;

    function handleMotion(e: DeviceMotionEvent) {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      // Resultante dos três eixos menos gravidade estimada (~9.8)
      const resultante =
        Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2) - 9.8;
      accelRef.current = resultante;
    }

    // iOS 13+ exige permissão explícita
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
          if (perm === "granted") {
            window.addEventListener("devicemotion", handleMotion);
          }
        })
        .catch(console.warn);
    } else {
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [trip?.id]);

  // ── GPS ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!trip?.id) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        // Limpa erro de GPS se havia um anterior
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

        // ── Status label ──────────────────────────────────────────────────
        const label =
          kmh > 5 ? TRACKING_STATUS.EN_ROUTE : TRACKING_STATUS.STOPPED;

        setSpeed(kmh);
        setStatusLabel(label);

        // ── Grava ponto na rota (throttle) ────────────────────────────────
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

        db.trips.get(trip.id!).then((current) => {
          if (!current) return;
          const route = [...(current.route ?? []), newPoint];
          db.trips.update(trip.id!, {
            lat: latitude,
            lng: longitude,
            speed: kmh,
            statusLabel: label,
            route,
          });
        });
      },
      (err) => {
        const info = GPS_ERROR_MESSAGES[err.code] ?? {
          title: "Erro de GPS",
          instructions: err.message,
        };
        console.error("Erro GPS:", info.title, `(code ${err.code})`);
        setGpsError({ code: err.code, ...info });
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [trip?.id]);

  // ── Cor do status ─────────────────────────────────────────────────────────
  const statusColor =
    statusLabel === TRACKING_STATUS.STOPPED
      ? "bg-yellow-500/20 text-yellow-300"
      : "bg-green-500/20 text-green-300";

  // ── Tela de erro de GPS ───────────────────────────────────────────────────
  if (gpsError) {
    return (
      <MobileLayout>
        <main className="min-h-screen bg-gradient-to-b from-indigo-950 to-indigo-900 text-white max-w-sm mx-auto flex flex-col p-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-zinc-400 mb-6 self-start"
          >
            ← Voltar
          </button>

          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            {/* Ícone */}
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl">
              📍
            </div>

            <div>
              <h2 className="text-xl font-bold text-red-300 mb-2">
                {gpsError.title}
              </h2>
              <p className="text-indigo-300 text-sm leading-relaxed">
                {gpsError.instructions}
              </p>
            </div>

            {/* Instrução específica para permissão negada */}
            {gpsError.code === 1 && (
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                  Como habilitar:
                </p>
                <ol className="text-sm text-indigo-200 space-y-1 list-decimal list-inside">
                  <li>Abra as configurações do navegador</li>
                  <li>Acesse Privacidade → Permissões de localização</li>
                  <li>Encontre este site e selecione &ldquo;Permitir&rdquo;</li>
                  <li>Recarregue a página</li>
                </ol>
              </div>
            )}

            <Button
              onClick={() => window.location.reload()}
              className="w-full h-12 rounded-2xl text-base font-semibold"
            >
              Tentar novamente
            </Button>
          </div>
        </main>
      </MobileLayout>
    );
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Uso em andamento</h1>
              <p className="text-indigo-300 mt-2">Veículo em uso</p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}
            >
              ● {statusLabel}
            </div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="rounded-3xl p-6 bg-white text-zinc-900 border-none shadow-2xl">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-zinc-500 mb-1">KM inicial</p>
              <h1 className="text-3xl font-bold tracking-tight">
                {trip?.startKm?.toLocaleString("pt-BR")}
              </h1>
            </div>
            <div className="border-t border-zinc-200" />
            <div>
              <p className="text-sm text-zinc-500 mb-1">Tempo percorrido</p>
              <h4 className="text-3xl font-bold tracking-tight">{time}</h4>
            </div>
            <div className="border-t border-zinc-200" />
            <div>
              <p className="text-sm text-zinc-500 mb-1">Velocidade atual</p>
              <div className="flex items-end gap-1">
                <h4 className="text-3xl font-bold tracking-tight">{speed}</h4>
                <span className="text-zinc-400 text-sm mb-1">km/h</span>
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
