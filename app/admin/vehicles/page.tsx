"use client";

import { useState, useMemo } from "react";
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
import { db, type Vehicle } from "@/lib/db";

import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/services/vehicleService";
import { syncPendingItems } from "@/services/syncService";

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
  const allVehiclesRaw = useLiveQuery(() => db.vehicles.toArray(), []);
  const loading = allVehiclesRaw === undefined;

  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("model");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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
      if (editingId !== null)
        await updateVehicle(editingId, {
          model,
          plate,
          type,
          km: Number(km),
          status,
        });
      else await createVehicle({ model, plate, type, km: Number(km), status });
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
    setEditingId(null);
    setFormError("");
    setOpen(false);
  }

  function handleEditVehicle(vehicle: Vehicle) {
    setEditingId(vehicle.id ?? null);
    setModel(vehicle.model);
    setPlate(vehicle.plate);
    setKm(vehicle.km?.toString() || "");
    setType(vehicle.type);
    setStatus(vehicle.status);
    setOpen(true);
    setOpenMenuId(null);
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
            {paginatedVehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">{vehicle.model}</TableCell>
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
                        openMenuId === vehicle.id ? null : (vehicle.id ?? null),
                      )
                    }
                    onEdit={() => handleEditVehicle(vehicle)}
                    onDelete={async () => {
                      if (!vehicle.id) return;
                      await deleteVehicle(vehicle.id);
                      syncPendingItems();
                    }}
                    onQr={() => handleOpenQr(vehicle)}
                  />
                </TableCell>
              </TableRow>
            ))}
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
            <FormLabel>Modelo</FormLabel>
            <FormInput
              placeholder="Fiat Palio"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <FormLabel>Placa</FormLabel>
            <FormInput
              placeholder="ABC1234"
              value={plate}
              maxLength={7}
              onChange={(e) =>
                setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
            />
          </div>
          <div className="space-y-2">
            <FormLabel>Tipo</FormLabel>
            <FormSelect
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
            <FormLabel>KM atual</FormLabel>
            <FormInput
              type="text"
              inputMode="numeric"
              placeholder="120000"
              value={km}
              maxLength={6}
              onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="space-y-2">
            <FormLabel>Status</FormLabel>
            <FormSelect
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
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <Button className="w-full" onClick={handleCreateVehicle}>
            {editingId !== null ? "Salvar alterações" : "Salvar veículo"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
