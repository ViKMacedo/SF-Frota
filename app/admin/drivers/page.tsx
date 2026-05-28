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

import { useDrivers } from "@/hooks/useDrivers";
import { Driver } from "@/lib/mockdata";

export default function DriversPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [licenseCategory, setLicenseCategory] = useState<
    "A" | "B" | "C" | "D" | "E" | "AB"
  >("AB");
  const [status, setStatus] = useState<"Disponível" | "Em rota" | "Inativo">(
    "Disponível",
  );
  const { drivers, addDriver, deleteDriver, updateDriver } = useDrivers();

  function handleSaveDriver() {
    if (!name || pin.length !== 4) return;
    const driverData = {
      name,
      pin,
      licenseCategory,
      status,
      assignedVehicleId: null,
    };

    if (editingId !== null) {
      updateDriver(editingId, driverData);
    } else {
      addDriver(driverData);
    }

    setName("");
    setPin("");
    setLicenseCategory("AB");
    setStatus("Disponível");
    setEditingId(null);
    setOpen(false);
  }

  function handleEditDriver(driver: Driver) {
    setEditingId(driver.id);
    setName(driver.name);
    setPin(driver.pin);
    setLicenseCategory(driver.licenseCategory);
    setStatus(driver.status);
    setOpen(true);
    setOpenMenuId(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <Header title="Motoristas" description="Gestão de motoristas" />
        <Button
          className="bg-indigo-600 hover:bg-indigo-500 transition px-5 py-3 rounded-2xl font-medium"
          onClick={() => setOpen(true)}
        >
          Novo motorista
        </Button>
      </div>
      {/* Table */}
      <div className="overflow-x-auto no-scrollbar">
        <Table headers={["Nome", "PIN", "CNH", "Status", "Ações"]}>
          {drivers.map((driver) => (
            <TableRow key={driver.id}>
              <TableCell className="font-medium">{driver.name}</TableCell>
              <TableCell>{driver.pin}</TableCell>
              <TableCell>{driver.licenseCategory}</TableCell>
              <TableCell>
                <StatusBadge
                  status={
                    driver.status === "Em rota"
                      ? "active"
                      : driver.status === "Disponível"
                        ? "available"
                        : "inactive"
                  }
                />
              </TableCell>
              <TableCell>
                <ActionMenu
                  isOpen={openMenuId === driver.id}
                  onToggle={() =>
                    setOpenMenuId(openMenuId === driver.id ? null : driver.id)
                  }
                  onEdit={() => handleEditDriver(driver)}
                  onDelete={() => {
                    deleteDriver(driver.id);
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
        title={editingId !== null ? "Editar motorista" : "Novo motorista"}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel>Nome</FormLabel>
            <FormInput
              placeholder="Ex: João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <FormLabel>PIN</FormLabel>
            <FormInput
              type="text"
              inputMode="numeric"
              placeholder="1234"
              value={pin}
              maxLength={4}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setPin(value);
              }}
            />
          </div>
          <div className="space-y-2">
            <FormLabel>Categoria CNH</FormLabel>
            <FormSelect
              value={licenseCategory}
              onChange={(e) =>
                setLicenseCategory(
                  e.target.value as "A" | "B" | "C" | "D" | "E" | "AB",
                )
              }
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
              <option value="AB">AB</option>
            </FormSelect>
          </div>
          <div className="space-y-2">
            <FormLabel>Status</FormLabel>
            <FormSelect
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as "Disponível" | "Em rota" | "Inativo",
                )
              }
            >
              <option value="Disponível">Disponível</option>
              <option value="Em rota">Em rota</option>
              <option value="Inativo">Inativo</option>
            </FormSelect>
          </div>
          <Button className="w-full" onClick={handleSaveDriver}>
            {editingId !== null ? "Salvar alterações" : "Salvar motorista"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
