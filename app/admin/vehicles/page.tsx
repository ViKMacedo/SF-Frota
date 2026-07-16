"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import QRCode from "qrcode";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modal";
import { Header } from "@/components/admin/header";
import { Table } from "@/components/admin/table";
import { TableRow } from "@/components/admin/tablerow";
import { TableCell } from "@/components/admin/tablecell";
import { StatusBadge } from "@/components/admin/statusbadge";
import { FormInput } from "@/components/admin/formInput";
import { FormLabel } from "@/components/admin/formLabel";
import { FormSelect } from "@/components/admin/formSelect";
import { ActionMenu } from "@/components/admin/actionMenu";
import { ConfirmDialog } from "@/components/admin/confirmDialog";
import {
  db,
  type Vehicle,
  type MaintenanceKey,
  type MaintenanceState,
  MAINTENANCE_LABELS,
  MAINTENANCE_KEYS,
} from "@/lib/db";

import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/services/vehicleService";
import { syncPendingItems } from "@/services/syncService";
import {
  getMaintenanceItemStatus,
  countOverdueItems,
  type MaintenanceItemStatus,
} from "@/services/maintenanceService";

type SortField = "model" | "plate" | "type" | "km" | "status";
type SortDir = "asc" | "desc";
const ITEMS_PER_PAGE = 10;

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (sortField !== field) return <span className="text-zinc-700 ml-1">↕</span>;
  return (
    <span className="text-indigo-400 ml-1">
      {sortDir === "asc" ? "↑" : "↓"}
    </span>
  );
}

export default function VehiclesPage() {
  const router = useRouter();
  const allVehiclesRaw = useLiveQuery(() => db.vehicles.toArray(), []);
  const loading = allVehiclesRaw === undefined;

  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("model");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [selectedQrVehicle, setSelectedQrVehicle] = useState<Vehicle | null>(
    null,
  );
  const [qrCode, setQrCode] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [km, setKm] = useState("");
  const [type, setType] = useState<"Carro" | "Caminhão" | "Caminhonete">(
    "Carro",
  );
  const [status, setStatus] = useState<
    "Disponível" | "Em uso" | "Em manutenção" | "Inativo"
  >("Disponível");
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

  const [editingManutencao, setEditingManutencao] =
    useState<MaintenanceState | null>(null);

  function updateManutencaoForm(
    item: MaintenanceKey,
    field: "intervaloKm" | "intervaloDias",
    value: string,
  ) {
    setManutencaoForm((prev) => ({
      ...prev,
      [item]: { ...prev[item], [field]: value.replace(/\D/g, "") },
    }));
  }
  const [formError, setFormError] = useState("");
  const [page, setPage] = useState(1);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  const filteredVehicles = useMemo(() => {
    const allVehicles = allVehiclesRaw ?? [];
    const q = search.toLowerCase();
    return allVehicles
      .filter((v) => showInactive || v.status !== "Inativo")
      .filter(
        (v) =>
          !q ||
          v.model.toLowerCase().includes(q) ||
          v.plate.toLowerCase().includes(q) ||
          v.type.toLowerCase().includes(q) ||
          v.status.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (sortField === "km")
          return sortDir === "asc"
            ? Number(a.km) - Number(b.km)
            : Number(b.km) - Number(a.km);
        const av = (a[sortField] ?? "").toString().toLowerCase();
        const bv = (b[sortField] ?? "").toString().toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  }, [allVehiclesRaw, showInactive, search, sortField, sortDir]);

  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE);
  const paginatedVehicles = filteredVehicles.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  async function handleCreateVehicle() {
    const plateRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    if (!model) {
      setFormError("Informe o modelo do veículo.");
      return;
    }
    if (!plateRegex.test(plate)) {
      setFormError("Placa inválida. Use o formato ABC1234 ou ABC1D23.");
      return;
    }
    if (!km) {
      setFormError("Informe o KM atual.");
      return;
    }
    setFormError("");
    try {
      const fuelFields = {
        consumoMedioKmL: consumoMedioKmL ? Number(consumoMedioKmL) : undefined,
        capacidadeTanqueL: capacidadeTanqueL
          ? Number(capacidadeTanqueL)
          : undefined,
      };
      const manutencao = MAINTENANCE_KEYS.reduce((acc, key) => {
        const { intervaloKm, intervaloDias } = manutencaoForm[key];
        const existing = editingManutencao?.[key];
        const intervaloKmNum = intervaloKm ? Number(intervaloKm) : 0;
        const intervaloDiasNum = intervaloDias ? Number(intervaloDias) : 0;
        const estaSendoConfiguradoAgora =
          !existing && (intervaloKmNum > 0 || intervaloDiasNum > 0);
        acc[key] = {
          intervaloKm: intervaloKmNum,
          intervaloDias: intervaloDiasNum,
          // Só assume "a contagem começa agora" quando o item está sendo
          // configurado pela primeira vez (tem intervalo definido e não
          // tinha registro anterior). Itens deixados em branco continuam
          // neutros (0/vazio) — sem isso, qualquer item sem intervalo
          // acabava herdando um "feito hoje" só por estar no mesmo save.
          ultimoKm:
            existing?.ultimoKm ?? (estaSendoConfiguradoAgora ? Number(km) : 0),
          ultimaData:
            existing?.ultimaData ??
            (estaSendoConfiguradoAgora ? new Date().toISOString() : ""),
        };
        return acc;
      }, {} as MaintenanceState);

      if (editingId !== null)
        await updateVehicle(editingId, {
          model,
          plate,
          type,
          km: Number(km),
          status,
          ...fuelFields,
          manutencao,
        });
      else
        await createVehicle({
          model,
          plate,
          type,
          km: Number(km),
          status,
          ...fuelFields,
          manutencao,
        });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Erro ao salvar veículo.",
      );
      return;
    }
    syncPendingItems();
    resetForm();
  }

  function resetForm() {
    setModel("");
    setPlate("");
    setKm("");
    setType("Carro");
    setStatus("Disponível");
    setConsumoMedioKmL("");
    setCapacidadeTanqueL("");
    setManutencaoForm({
      oleo: { intervaloKm: "", intervaloDias: "" },
      pneus: { intervaloKm: "", intervaloDias: "" },
      freios: { intervaloKm: "", intervaloDias: "" },
      filtros: { intervaloKm: "", intervaloDias: "" },
    });
    setEditingManutencao(null);
    setEditingId(null);
    setFormError("");
    setOpen(false);
  }

  async function handleOpenQr(vehicle: Vehicle) {
    setSelectedQrVehicle(vehicle);
    setQrCode(
      await QRCode.toDataURL(JSON.stringify({ vehicleId: vehicle.id })),
    );
    setOpenMenuId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <Header title="Veículos" description="Gestão da frota" />
        <Button
          className="bg-indigo-600 hover:bg-indigo-500 transition px-5 py-3 rounded-2xl font-medium"
          onClick={() => setOpen(true)}
        >
          Novo veículo
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por modelo, placa, tipo..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowInactive((v) => !v);
              setPage(1);
            }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showInactive ? "bg-indigo-600" : "bg-zinc-700"}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${showInactive ? "translate-x-4" : "translate-x-1"}`}
            />
          </button>
          <span className="text-sm text-zinc-500 whitespace-nowrap">
            Mostrar inativos
          </span>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            Carregando...
          </div>
        ) : (
          <Table
            headers={[
              <button
                key="model"
                onClick={() => toggleSort("model")}
                className="flex items-center hover:text-white transition"
              >
                Modelo{" "}
                <SortIcon
                  field="model"
                  sortField={sortField}
                  sortDir={sortDir}
                />
              </button>,
              <button
                key="plate"
                onClick={() => toggleSort("plate")}
                className="flex items-center hover:text-white transition"
              >
                Placa{" "}
                <SortIcon
                  field="plate"
                  sortField={sortField}
                  sortDir={sortDir}
                />
              </button>,
              <button
                key="type"
                onClick={() => toggleSort("type")}
                className="flex items-center hover:text-white transition"
              >
                Tipo{" "}
                <SortIcon
                  field="type"
                  sortField={sortField}
                  sortDir={sortDir}
                />
              </button>,
              <button
                key="km"
                onClick={() => toggleSort("km")}
                className="flex items-center hover:text-white transition"
              >
                KM{" "}
                <SortIcon field="km" sortField={sortField} sortDir={sortDir} />
              </button>,
              <button
                key="status"
                onClick={() => toggleSort("status")}
                className="flex items-center hover:text-white transition"
              >
                Status{" "}
                <SortIcon
                  field="status"
                  sortField={sortField}
                  sortDir={sortDir}
                />
              </button>,
              "Ações",
            ]}
          >
            {paginatedVehicles.map((vehicle) => {
              const overdueCount = countOverdueItems(vehicle);
              return (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">
                    {vehicle.model}
                    {overdueCount > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 bg-red-500/10 text-red-400 text-xs font-medium px-2 py-0.5 rounded-full align-middle">
                        ⚠{" "}
                        {overdueCount === 1
                          ? "1 pendência"
                          : `${overdueCount} pendências`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{vehicle.plate}</TableCell>
                  <TableCell>{vehicle.type}</TableCell>
                  <TableCell>{vehicle.km} km</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={
                        vehicle.status === "Em uso"
                          ? "active"
                          : vehicle.status === "Em manutenção"
                            ? "maintenance"
                            : vehicle.status === "Disponível"
                              ? "available"
                              : "inactive"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <ActionMenu
                      isOpen={openMenuId === vehicle.id}
                      onToggle={() =>
                        setOpenMenuId(
                          openMenuId === vehicle.id
                            ? null
                            : (vehicle.id ?? null),
                        )
                      }
                      onEdit={() =>
                        router.push(`/admin/vehicles/${vehicle.id}`)
                      }
                      onDelete={() => setVehicleToDelete(vehicle)}
                      onQr={() => handleOpenQr(vehicle)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {paginatedVehicles.length === 0 && (
              <TableRow>
                <TableCell className="py-10 text-center text-zinc-500">
                  Nenhum veículo encontrado.
                </TableCell>
              </TableRow>
            )}
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-zinc-500">
          {loading
            ? ""
            : filteredVehicles.length === 0
              ? "Nenhum resultado"
              : `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filteredVehicles.length)} de ${filteredVehicles.length} veículos`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Página anterior"
            className="rounded-xl border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
          >
            ←
          </Button>
          <div className="px-4 text-sm font-medium text-zinc-400">
            {page} / {Math.max(totalPages, 1)}
          </div>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Próxima página"
            className="rounded-xl border-zinc-700 bg-zinc-900 hover:bg-indigo-600 hover:border-indigo-600"
          >
            →
          </Button>
        </div>
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
            <div className="bg-white p-4 rounded-3xl">
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

      <Modal
        open={open}
        onClose={resetForm}
        title={editingId !== null ? "Editar veículo" : "Novo veículo"}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel htmlFor="vehicle-model">Modelo</FormLabel>
            <FormInput
              id="vehicle-model"
              placeholder="Fiat Palio"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="vehicle-plate">Placa</FormLabel>
            <FormInput
              id="vehicle-plate"
              placeholder="ABC1234"
              value={plate}
              maxLength={7}
              onChange={(e) =>
                setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
            />
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="vehicle-type">Tipo</FormLabel>
            <FormSelect
              id="vehicle-type"
              value={type}
              onChange={(e) =>
                setType(e.target.value as "Carro" | "Caminhão" | "Caminhonete")
              }
            >
              <option value="Carro">Carro</option>
              <option value="Caminhão">Caminhão</option>
              <option value="Caminhonete">Caminhonete</option>
            </FormSelect>
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="vehicle-km">KM atual</FormLabel>
            <FormInput
              id="vehicle-km"
              type="text"
              inputMode="numeric"
              placeholder="120000"
              value={km}
              maxLength={6}
              onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="vehicle-status">Status</FormLabel>
            <FormSelect
              id="vehicle-status"
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as
                    | "Disponível"
                    | "Em uso"
                    | "Em manutenção"
                    | "Inativo",
                )
              }
            >
              <option value="Disponível">Disponível</option>
              <option value="Em uso">Em uso</option>
              <option value="Em manutenção">Em manutenção</option>
              <option value="Inativo">Inativo</option>
            </FormSelect>
          </div>
          <div className="pt-2 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 mb-3">
              Usado para estimar o nível de combustível (opcional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <FormLabel htmlFor="vehicle-consumo">Consumo (km/L)</FormLabel>
                <FormInput
                  id="vehicle-consumo"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 12"
                  value={consumoMedioKmL}
                  onChange={(e) =>
                    setConsumoMedioKmL(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="vehicle-tanque">
                  Capacidade tanque (L)
                </FormLabel>
                <FormInput
                  id="vehicle-tanque"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 55"
                  value={capacidadeTanqueL}
                  onChange={(e) =>
                    setCapacidadeTanqueL(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 mb-3">
              Manutenção preventiva — vence o que chegar primeiro (opcional)
            </p>
            <div className="space-y-3">
              {MAINTENANCE_KEYS.map((key) => {
                const itemStatus: MaintenanceItemStatus | null =
                  editingManutencao && km
                    ? getMaintenanceItemStatus(
                        editingManutencao[key],
                        Number(km),
                      )
                    : null;
                return (
                  <div key={key} className="grid grid-cols-3 gap-3 items-end">
                    <div className="pb-2">
                      <p className="text-sm text-zinc-300">
                        {MAINTENANCE_LABELS[key]}
                      </p>
                      {itemStatus && (
                        <p
                          className={`text-xs mt-0.5 flex items-center gap-1.5 ${
                            itemStatus.urgency === "vencido"
                              ? "text-red-400"
                              : itemStatus.urgency === "proximo"
                                ? "text-yellow-400"
                                : itemStatus.urgency === "em-dia"
                                  ? "text-green-400"
                                  : "text-zinc-600"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              itemStatus.urgency === "vencido"
                                ? "bg-red-500"
                                : itemStatus.urgency === "proximo"
                                  ? "bg-yellow-500"
                                  : itemStatus.urgency === "em-dia"
                                    ? "bg-green-500"
                                    : "bg-zinc-600"
                            }`}
                            aria-hidden="true"
                          />
                          {itemStatus.label}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <FormLabel htmlFor={`vehicle-manut-${key}-km`}>
                        A cada (km)
                      </FormLabel>
                      <FormInput
                        id={`vehicle-manut-${key}-km`}
                        type="text"
                        inputMode="numeric"
                        placeholder="10000"
                        value={manutencaoForm[key].intervaloKm}
                        onChange={(e) =>
                          updateManutencaoForm(
                            key,
                            "intervaloKm",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <FormLabel htmlFor={`vehicle-manut-${key}-dias`}>
                        A cada (dias)
                      </FormLabel>
                      <FormInput
                        id={`vehicle-manut-${key}-dias`}
                        type="text"
                        inputMode="numeric"
                        placeholder="180"
                        value={manutencaoForm[key].intervaloDias}
                        onChange={(e) =>
                          updateManutencaoForm(
                            key,
                            "intervaloDias",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <Button className="w-full" onClick={handleCreateVehicle}>
            {editingId !== null ? "Salvar alterações" : "Salvar veículo"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={vehicleToDelete !== null}
        onOpenChange={(open) => !open && setVehicleToDelete(null)}
        title="Excluir veículo"
        description={
          vehicleToDelete
            ? `Tem certeza que deseja excluir "${vehicleToDelete.model} (${vehicleToDelete.plate})"? Essa ação não pode ser desfeita.`
            : ""
        }
        onConfirm={async () => {
          if (!vehicleToDelete?.id) return;
          await deleteVehicle(vehicleToDelete.id);
          syncPendingItems();
        }}
      />
    </div>
  );
}
