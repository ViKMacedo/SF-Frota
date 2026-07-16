"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/statusbadge";
import { FormInput } from "@/components/admin/formInput";
import { FormLabel } from "@/components/admin/formLabel";
import { FormSelect } from "@/components/admin/formSelect";
import { ConfirmDialog } from "@/components/admin/confirmDialog";

import {
  MAINTENANCE_KEYS,
  MAINTENANCE_LABELS,
  type MaintenanceKey,
  type MaintenanceState,
  type Trip,
  type Vehicle,
} from "@/lib/db";
import {
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from "@/services/vehicleService";
import { getTripsByVehicle } from "@/services/tripService";
import { estimateFuelLevel, estimateRangeKm } from "@/services/refuelService";
import { getVehicleMaintenanceStatus } from "@/services/maintenanceService";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Pencil, QrCode, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import Image from "next/image";
import { Modal } from "@/components/admin/modal";

const URGENCY_STYLE: Record<string, string> = {
  vencido: "bg-red-500/10 text-red-400",
  proximo: "bg-yellow-500/10 text-yellow-400",
  "em-dia": "bg-green-500/10 text-green-400",
  "nao-configurado": "bg-zinc-800 text-zinc-500",
};

export default function VehicleProfilePage() {
  const router = useRouter();
  const params = useParams<{ vehicleId: string }>();
  const vehicleId = params.vehicleId;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedQrVehicle, setSelectedQrVehicle] = useState<Vehicle | null>(
    null,
  );

  const [qrCode, setQrCode] = useState("");

  // Estado do formulário (só usado quando editing = true)
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [type, setType] = useState<Vehicle["type"]>("Carro");
  const [km, setKm] = useState("");
  const [status, setStatus] = useState<Vehicle["status"]>("Disponível");
  const [consumoMedioKmL, setConsumoMedioKmL] = useState("");
  const [capacidadeTanqueL, setCapacidadeTanqueL] = useState("");
  const [manutencaoForm, setManutencaoForm] = useState<
    Record<MaintenanceKey, { intervaloKm: string; intervaloDias: string }>
  >({
    oleo: { intervaloKm: "", intervaloDias: "" },
    pneus: { intervaloKm: "", intervaloDias: "" },
    freios: { intervaloKm: "", intervaloDias: "" },
    filtros: { intervaloKm: "", intervaloDias: "" },
  });

  async function load() {
    setLoading(true);
    const [v, t] = await Promise.all([
      getVehicleById(vehicleId),
      getTripsByVehicle(vehicleId),
    ]);
    setVehicle(v ?? null);
    setTrips(t);
    setLoading(false);
  }

  function vehicleStatusToBadge(
    status: Vehicle["status"],
  ): "active" | "maintenance" | "available" | "inactive" {
    switch (status) {
      case "Em uso":
        return "active";
      case "Em manutenção":
        return "maintenance";
      case "Disponível":
        return "available";
      default:
        return "inactive";
    }
  }
  useEffect(() => {
    let cancelled = false;

    async function fetchVehicle() {
      setLoading(true);

      const [v, t] = await Promise.all([
        getVehicleById(vehicleId),
        getTripsByVehicle(vehicleId),
      ]);

      if (cancelled) return;
      setVehicle(v ?? null);
      setTrips(t);
      setLoading(false);
    }

    fetchVehicle();

    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicleId) return;

    QRCode.toDataURL(
      JSON.stringify({
        vehicleId,
      }),
    ).then(setQrCode);
  }, [vehicleId]);

  function startEditing() {
    if (!vehicle) return;
    setModel(vehicle.model);
    setPlate(vehicle.plate);
    setType(vehicle.type);
    setKm(String(vehicle.km));
    setStatus(vehicle.status);
    setConsumoMedioKmL(vehicle.consumoMedioKmL?.toString() ?? "");
    setCapacidadeTanqueL(vehicle.capacidadeTanqueL?.toString() ?? "");
    setManutencaoForm(
      MAINTENANCE_KEYS.reduce(
        (acc, key) => {
          const item = vehicle.manutencao?.[key];
          acc[key] = {
            intervaloKm: item?.intervaloKm ? String(item.intervaloKm) : "",
            intervaloDias: item?.intervaloDias
              ? String(item.intervaloDias)
              : "",
          };
          return acc;
        },
        {} as Record<
          MaintenanceKey,
          { intervaloKm: string; intervaloDias: string }
        >,
      ),
    );
    setEditing(true);
  }

  async function handleSave() {
    if (!vehicle) return;
    setSaving(true);
    try {
      const manutencao = MAINTENANCE_KEYS.reduce((acc, key) => {
        const { intervaloKm, intervaloDias } = manutencaoForm[key];
        const existing = vehicle.manutencao?.[key];
        const intervaloKmNum = intervaloKm ? Number(intervaloKm) : 0;
        const intervaloDiasNum = intervaloDias ? Number(intervaloDias) : 0;
        const estaSendoConfiguradoAgora =
          !existing && (intervaloKmNum > 0 || intervaloDiasNum > 0);
        acc[key] = {
          intervaloKm: intervaloKmNum,
          intervaloDias: intervaloDiasNum,
          ultimoKm:
            existing?.ultimoKm ?? (estaSendoConfiguradoAgora ? Number(km) : 0),
          ultimaData:
            existing?.ultimaData ??
            (estaSendoConfiguradoAgora ? new Date().toISOString() : ""),
        };
        return acc;
      }, {} as MaintenanceState);

      await updateVehicle(vehicle.id, {
        model,
        plate,
        type,
        km: Number(km),
        status,
        consumoMedioKmL: consumoMedioKmL ? Number(consumoMedioKmL) : undefined,
        capacidadeTanqueL: capacidadeTanqueL
          ? Number(capacidadeTanqueL)
          : undefined,
        manutencao,
      });
      await load();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-zinc-500 p-8">Carregando veículo...</p>;
  }

  if (!vehicle) {
    return (
      <div className="p-8">
        <p className="text-zinc-500 mb-4">Veículo não encontrado.</p>
        <Button onClick={() => router.push("/admin/vehicles")}>
          Voltar pra lista
        </Button>
      </div>
    );
  }

  const nivelCombustivel = estimateFuelLevel(vehicle, vehicle.km);
  const autonomia =
    nivelCombustivel !== undefined
      ? estimateRangeKm(vehicle, nivelCombustivel)
      : undefined;
  const manutencaoStatus = getVehicleMaintenanceStatus(vehicle);

  function handleQr() {
    if (!vehicle) return;
    setSelectedQrVehicle(vehicle);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button
        onClick={() => router.push("/admin/vehicles")}
        className="text-sm text-zinc-400 hover:text-white mb-6 flex items-center gap-1.5"
      >
        ← Voltar pra lista
      </button>

      {/* Cabeçalho */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
        <Card className="mb-1 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex gap-6">
              <div
                className="
                h-24
                w-24
                rounded-3xl
                flex
                items-center
                justify-center
                shadow-xl
                shrink-0
                "
              >
                <Car className="h-12 w-12 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-indigo-300 gap-3">
                  Veículo
                </p>
                <h1 className="text-4xl font-bold text-white mt-1">
                  {vehicle.model}
                </h1>
                <p className="text-zinc-400 mt-1">
                  {vehicle.plate} • {vehicle.type}
                </p>
                <StatusBadge status={vehicleStatusToBadge(vehicle.status)} />
              </div>
            </div>

            <div className="w-full max-w-[200px]">
              {" "}
              <Card variant="default">
                {" "}
                <CardContent className="p-3">
                  {" "}
                  <div className="space-y-2">
                    {" "}
                    {!editing ? (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full justify-start gap-2.5 rounded-xl h-9"
                          onClick={startEditing}
                        >
                          <Pencil className="h-5 w-5" />{" "}
                          <span className="text-sm font-medium">
                            Editar veículo
                          </span>{" "}
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full justify-start gap-2.5 rounded-xl h-9"
                          onClick={handleQr}
                        >
                          <QrCode className="h-5 w-5" />
                          <span className="text-sm font-medium">QR Code</span>
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full justify-start gap-2.5 rounded-xl h-9"
                          onClick={() => setDeleteOpen(true)}
                        >
                          <Trash2 className="h-5 w-5" />
                          <span className="text-sm font-medium">
                            Excluir veículo
                          </span>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          className="w-full justify-start gap-2.5 rounded-xl h-9"
                          onClick={handleSave}
                        >
                          <span className="text-sm font-medium">
                            Salvar alterações
                          </span>
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full justify-start gap-2.5 rounded-xl h-9"
                          onClick={() => {
                            setEditing(false);
                          }}
                        >
                          <span className="text-sm font-medium">Cancelar</span>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Card>

        {editing && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-800">
            <div className="space-y-2">
              <FormLabel htmlFor="v-type">Tipo</FormLabel>
              <FormSelect
                id="v-type"
                value={type}
                onChange={(e) => setType(e.target.value as Vehicle["type"])}
              >
                <option value="Carro">Carro</option>
                <option value="Caminhão">Caminhão</option>
                <option value="Caminhonete">Caminhonete</option>
              </FormSelect>
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="v-km">KM atual</FormLabel>
              <FormInput
                id="v-km"
                type="text"
                inputMode="numeric"
                value={km}
                onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="v-status">Status</FormLabel>
              <FormSelect
                id="v-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Vehicle["status"])}
              >
                <option value="Disponível">Disponível</option>
                <option value="Em uso">Em uso</option>
                <option value="Em manutenção">Em manutenção</option>
                <option value="Inativo">Inativo</option>
              </FormSelect>
            </div>
          </div>
        )}
      </div>

      {/* KM, Combustível */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs text-zinc-500 mb-1">KM total</p>
          <p className="text-2xl font-semibold">
            {vehicle.km.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs text-zinc-500 mb-1">Combustível estimado</p>
          {nivelCombustivel !== undefined ? (
            <p className="text-2xl font-semibold">
              {Math.round(nivelCombustivel)}%
              {autonomia !== undefined && (
                <span className="text-xs text-zinc-500 font-normal">
                  {" "}
                  &middot; ~{autonomia} km
                </span>
              )}
            </p>
          ) : (
            <p className="text-sm text-zinc-600">Não configurado</p>
          )}
          {editing && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <FormInput
                type="text"
                inputMode="decimal"
                placeholder="km/L"
                value={consumoMedioKmL}
                onChange={(e) =>
                  setConsumoMedioKmL(e.target.value.replace(/[^0-9.]/g, ""))
                }
              />
              <FormInput
                type="text"
                inputMode="decimal"
                placeholder="Tanque (L)"
                value={capacidadeTanqueL}
                onChange={(e) =>
                  setCapacidadeTanqueL(e.target.value.replace(/[^0-9.]/g, ""))
                }
              />
            </div>
          )}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs text-zinc-500 mb-1">Último motorista</p>
          <p className="text-lg font-medium">{vehicle.lastDriver ?? "—"}</p>
        </div>
      </div>

      {/* Manutenção */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Manutenção preventiva</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MAINTENANCE_KEYS.map((key) => {
            const st = manutencaoStatus?.[key];
            return (
              <div
                key={key}
                className="bg-zinc-800/50 rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {MAINTENANCE_LABELS[key]}
                  </p>
                  {!editing && st && (
                    <p className="text-xs text-zinc-500 mt-0.5">{st.label}</p>
                  )}
                  {editing && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <FormInput
                        type="text"
                        inputMode="numeric"
                        placeholder="km"
                        value={manutencaoForm[key].intervaloKm}
                        onChange={(e) =>
                          setManutencaoForm((prev) => ({
                            ...prev,
                            [key]: {
                              ...prev[key],
                              intervaloKm: e.target.value.replace(/\D/g, ""),
                            },
                          }))
                        }
                      />
                      <FormInput
                        type="text"
                        inputMode="numeric"
                        placeholder="dias"
                        value={manutencaoForm[key].intervaloDias}
                        onChange={(e) =>
                          setManutencaoForm((prev) => ({
                            ...prev,
                            [key]: {
                              ...prev[key],
                              intervaloDias: e.target.value.replace(/\D/g, ""),
                            },
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
                {!editing && (
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${URGENCY_STYLE[st?.urgency ?? "nao-configurado"]}`}
                  >
                    {st?.urgency === "vencido"
                      ? "Vencido"
                      : st?.urgency === "proximo"
                        ? "Em breve"
                        : st?.urgency === "em-dia"
                          ? "Em dia"
                          : "—"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Histórico de viagens */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <h2 className="text-lg font-semibold mb-4">Últimas viagens</h2>
        {trips.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhuma viagem registrada ainda.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-800">
            {trips.slice(0, 10).map((trip) => (
              <div
                key={trip.id}
                className="py-3 flex items-center justify-between gap-3 text-sm"
              >
                <span className="font-medium">{trip.driverName}</span>
                <span className="text-zinc-500">
                  {new Date(trip.startedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-zinc-400">
                  {trip.distance !== undefined
                    ? `${trip.distance} km`
                    : trip.status === "Em andamento"
                      ? "Em andamento"
                      : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal
        open={!!selectedQrVehicle}
        onClose={() => {
          setSelectedQrVehicle(null);
          setQrCode("");
        }}
        title="QR Code do veículo"
      >
        <div className="flex flex-col items-center">
          {qrCode && (
            <div className="rounded-3xl bg-white p-4">
              <Image
                src={qrCode}
                alt="QR Code"
                width={256}
                height={256}
                className="rounded-2xl"
              />
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-lg font-semibold">{selectedQrVehicle?.model}</p>

            <p className="text-zinc-500">{selectedQrVehicle?.plate}</p>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir veículo"
        description={`Tem certeza que deseja excluir "${vehicle.model} (${vehicle.plate})"? Essa ação não pode ser desfeita.`}
        onConfirm={async () => {
          await deleteVehicle(vehicle.id);
          router.push("/admin/vehicles");
        }}
      />
    </div>
  );
}
