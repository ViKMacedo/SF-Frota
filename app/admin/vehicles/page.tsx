"use client";

import { useEffect, useState } from "react";
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
import type { Vehicle } from "@/lib/db";

import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/services/vehicleService";

export default function VehiclesPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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
  useEffect(() => {
    loadVehicles();
  }, []);
  async function loadVehicles() {
    const data = await getVehicles();
    setVehicles(data);
  }

  async function handleCreateVehicle() {
    const plateRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    if (!model || !plateRegex.test(plate) || !km) {
      return;
    }

    const vehicleData = {
      model,
      plate,
      type,
      km: Number(km),
      status,
    };

    if (editingId !== null) {
      await updateVehicle(editingId, vehicleData);
    } else {
      await createVehicle(vehicleData);
    }

    await loadVehicles();
    resetForm();
  }

  function resetForm() {
    setModel("");
    setPlate("");
    setKm("");
    setType("Carro");
    setStatus("Disponível");
    setEditingId(null);
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
    const qrData = JSON.stringify({
      vehicleId: vehicle.id,
    });

    const qr = await QRCode.toDataURL(qrData);
    setQrCode(qr);
    setOpenMenuId(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <Header title="Veículos" description="Gestão da frota" />
        <Button
          className="bg-indigo-600 hover:bg-indigo-500 transition px-5 py-3 rounded-2xl font-medium"
          onClick={() => setOpen(true)}
        >
          Novo veículo
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto no-scrollbar">
        <Table headers={["Modelo", "Placa", "Tipo", "KM", "Status", "Ações"]}>
          {vehicles.map((vehicle) => (
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
                    if (!vehicle.id) {
                      return;
                    }

                    await deleteVehicle(vehicle.id);
                    await loadVehicles();
                    setOpenMenuId(null);
                  }}
                  onQr={() => handleOpenQr(vehicle)}
                />
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </div>

      {/* QR Modal */}
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

      {/* Modal */}
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
              onChange={(e) => {
                const value = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "");

                setPlate(value);
              }}
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
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setKm(value);
              }}
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
          <Button className="w-full" onClick={handleCreateVehicle}>
            {editingId !== null ? "Salvar alterações" : "Salvar veículo"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
