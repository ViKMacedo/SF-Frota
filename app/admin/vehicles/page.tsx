"use client";

import { useState } from "react";

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

import { useVehicles } from "@/hooks/useVehicles";
import { Vehicle } from "@/lib/mockdata";

export default function VehiclesPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [km, setKm] = useState("");
  const [status, setStatus] = useState<
    "Disponível" | "Em uso" | "Em manutenção" | "Inativo"
  >("Disponível");
  const { vehicles, addVehicle, deleteVehicle, updateVehicle } = useVehicles();
  function handleCreateVehicle() {
    if (!model || !plate || km.length < 5 || km.length > 6) return;
    const vehicleData = {
      model,
      plate,
      km: Number(km),
      status,
    };

    if (editingId !== null) {
      updateVehicle(editingId, vehicleData);
    } else {
      addVehicle(vehicleData);
    }

    setModel("");
    setPlate("");
    setKm("");
    setStatus("Disponível");
    setEditingId(null);
    setOpen(false);
  }

  function handleEditVehicle(vehicle: Vehicle) {
    setEditingId(vehicle.id);
    setModel(vehicle.model);
    setPlate(vehicle.plate);
    setKm(vehicle.km.toString());
    setStatus(vehicle.status);
    setOpen(true);
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
        <Table headers={["Modelo", "Placa", "KM", "Status", "Ações"]}>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell className="font-medium">{vehicle.model}</TableCell>
              <TableCell>{vehicle.plate}</TableCell>
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
                    setOpenMenuId(openMenuId === vehicle.id ? null : vehicle.id)
                  }
                  onEdit={() => handleEditVehicle(vehicle)}
                  onDelete={() => {
                    deleteVehicle(vehicle.id);
                    setOpenMenuId(null);
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </div>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
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
