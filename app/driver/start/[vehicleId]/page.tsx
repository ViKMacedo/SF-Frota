"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";

import { MobileLayout } from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

import { db, type Vehicle } from "@/lib/db";
import { createTrip, getActiveTrip } from "@/services/tripService";
import { getVehicleById } from "@/services/vehicleService";
import { getDriverById } from "@/services/driverService";
import {
  canDriveVehicle,
  inferRequiredLicense,
} from "@/services/licenseService";
import { LicenseWarningDialog } from "@/components/driver/licenseWarningDialog";
import {
  ArrowRight,
  Car,
  CircleCheck,
  Gauge,
  Info,
  LoaderCircle,
  Route,
} from "lucide-react";

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), ms),
    ),
  ]);
}

export default function DriverStartPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const router = useRouter();
  const { toast, showToast, clearToast } = useToast();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [licenseWarning, setLicenseWarning] = useState<{
    driverLicense: string;
    requiredCategory: string;
  } | null>(null);
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

  async function proceedWithStart() {
    try {
      const activeTrip = await withTimeout(
        getActiveTrip(),
        15000,
        "Não foi possível verificar viagens ativas a tempo.",
      );

      if (activeTrip) {
        router.push("/driver/running");
        return;
      }

      if (!vehicle || !session) return;

      const position = await withTimeout(
        getCurrentPosition(),
        15000,
        "Não foi possível obter sua localização a tempo. Verifique o GPS e tente novamente.",
      );

      await withTimeout(
        createTrip({
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
        }),
        15000,
        "Não foi possível iniciar a viagem a tempo. Tente novamente.",
      );

      router.push("/driver/running");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao iniciar viagem";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStart() {
    if (submitting) return;
    setSubmitting(true);

    if (!vehicle || !session) {
      setSubmitting(false);
      return;
    }

    try {
      const driver = await withTimeout(
        getDriverById(session.userId!),
        10000,
        "Não foi possível validar seus dados a tempo.",
      );
      if (driver) {
        const requiredCategory = inferRequiredLicense(vehicle.type);
        if (!canDriveVehicle(driver.license, requiredCategory)) {
          setLicenseWarning({
            driverLicense: driver.license,
            requiredCategory,
          });
          setSubmitting(false);
          return;
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao validar motorista";
      showToast(message, "error");
      setSubmitting(false);
      return;
    }

    await proceedWithStart();
  }

  if (!vehicle) {
    return (
      <MobileLayout>
        <p className="text-indigo-300 text-sm">Carregando veículo...</p>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout className="p-4 flex flex-col justify-between min-h-screen">
      <Toast toast={toast} onClose={clearToast} />

      <div>
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

        <h1 className="text-3xl font-bold text-white">Iniciar uso</h1>

        <p className="text-indigo-300 text-sm mb-8">
          Confirme os dados abaixo antes de iniciar a viagem.
        </p>

        {/* Card: Veículo Selecionado */}
        <Card className="mb-5 rounded-3xl p-5 bg-[#131526]/40 border border-white/5 text-white">
          <div className="flex items-center gap-4">
            <div
              className="
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              bg-gradient-to-br from-indigo-600/80 to-indigo-700/80 shadow-lg"
            >
              <Car className="h-7 w-7 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-300">
                Veículo selecionado
              </p>

              <h2 className="mb-1 truncate text-xl font-bold text-white">
                {vehicle.model}
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-xl bg-indigo-800/80 px-3 py-1 text-xs font-semibold text-white">
                  {vehicle.plate}
                </span>

                {vehicle.lastDriver && (
                  <span className="rounded-xl border border-indigo-700/40 px-3 py-1 text-xs text-indigo-200 bg-indigo-950/20">
                    Último motorista: {vehicle.lastDriver}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Card: Resumo da Viagem */}
        <Card className="mb-5 rounded-3xl p-6 bg-[#131526]/40 border border-white/5 text-white">
          <h3 className="mb-5 text-xs font-medium uppercase tracking-wider text-indigo-300">
            Resumo da viagem
          </h3>

          {/* Odômetro */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/10">
              <Gauge className="h-8 w-8 text-indigo-400" strokeWidth={2} />
            </div>

            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-indigo-300">
                Odômetro atual
              </p>

              <div className="mt-1 flex items-end gap-2">
                <span className="text-4xl font-bold leading-none tracking-tight text-white">
                  {vehicle.km.toLocaleString("pt-BR")}
                </span>

                <span className="pb-1 text-sm text-indigo-300">km</span>
              </div>
            </div>
          </div>

          <div className="my-5 h-px bg-white/10" />

          {/* KM inicial */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/10">
              <Route className="h-8 w-8 text-emerald-400" strokeWidth={2} />
            </div>

            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-indigo-300">
                KM inicial da viagem
              </p>

              <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 border border-emerald-500/20">
                <CircleCheck className="h-4 w-4 text-emerald-400" />

                <span className="text-xs font-medium text-emerald-300">
                  Será registrado automaticamente
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card: Informativo de Rastreamento */}
        <Card className="mb-5 rounded-2xl p-4 bg-[#131526]/20 border border-white/5 text-white">
          <div className="flex items-start gap-3">
            <Info
              className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400"
              strokeWidth={2}
            />

            <p className="text-xs leading-relaxed text-indigo-200">
              Ao confirmar, o sistema registrará automaticamente o início da
              viagem, utilizará o odômetro atual como KM inicial e iniciará o
              rastreamento do veículo.
            </p>
          </div>
        </Card>
      </div>

      {/* Botão de Rodapé */}
      <div className="mt-auto pt-6 border-t border-white/5">
        <Button
          onClick={handleStart}
          disabled={submitting}
          className="w-full h-14 bg-zinc-900 border border-white/10 hover:bg-zinc-850 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-75"
        >
          {submitting ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin text-white" />
              Iniciando viagem...
            </>
          ) : (
            <>
              Confirmar e iniciar
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>

      {licenseWarning && (
        <LicenseWarningDialog
          open={licenseWarning !== null}
          onOpenChange={(open) => !open && setLicenseWarning(null)}
          driverLicense={licenseWarning.driverLicense}
          requiredCategory={licenseWarning.requiredCategory}
          onConfirm={() => {
            setSubmitting(true);
            proceedWithStart();
          }}
        />
      )}
    </MobileLayout>
  );
}
