"use client";

import { useState, useEffect } from "react";

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

import type { Driver } from "@/lib/db";
import {
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
} from "@/services/driverService";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [registration, setRegistration] = useState("");
  const [license, setLicense] = useState<"A" | "B" | "C" | "D" | "E" | "AB">(
    "B",
  );
  const [status, setStatus] = useState<"Ativo" | "Afastado" | "Férias">(
    "Ativo",
  );
  useEffect(() => {
    loadDrivers();
  }, []);
  async function loadDrivers() {
    const data = await getDrivers();

    setDrivers(data);
  }
  async function handleCreateDriver() {
    if (!name || registration.length !== 4 || !license) {
      return;
    }
    const driverData = {
      name,
      registration,
      license,
      status,
    };
    if (editingId !== null) {
      await updateDriver(editingId, driverData);
    } else {
      await createDriver(driverData);
    }
    await loadDrivers();
    resetForm();
  }

  function resetForm() {
    setName("");
    setRegistration("");
    setLicense("B");
    setStatus("Ativo");
    setEditingId(null);
    setOpen(false);
  }

  function handleEditDriver(driver: Driver) {
    setEditingId(driver.id ?? null);
    setName(driver.name);
    setRegistration(driver.registration);
    setLicense(driver.license);
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
              <TableCell>{driver.registration}</TableCell>
              <TableCell>{driver.license}</TableCell>
              <TableCell>
                <StatusBadge
                  status={
                    driver.status === "Ativo"
                      ? "active"
                      : driver.status === "Férias"
                        ? "maintenance"
                        : "inactive"
                  }
                />
              </TableCell>
              <TableCell>
                <ActionMenu
                  isOpen={openMenuId === driver.id}
                  onToggle={() =>
                    setOpenMenuId(
                      openMenuId === driver.id ? null : (driver.id ?? null),
                    )
                  }
                  onEdit={() => handleEditDriver(driver)}
                  onDelete={async () => {
                    if (!driver.id) {
                      return;
                    }
                    await deleteDriver(driver.id);
                    await loadDrivers();
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
              placeholder="João Silva"
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
              value={registration}
              maxLength={4}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setRegistration(value);
              }}
            />
          </div>
          <div className="space-y-2">
            <FormLabel>CNH</FormLabel>
            <FormSelect
              value={license}
              onChange={(e) =>
                setLicense(e.target.value as "A" | "B" | "C" | "D" | "E" | "AB")
              }
            >
              <option value="A">A</option> <option value="B">B</option>{" "}
              <option value="AB">AB</option> <option value="C">C</option>{" "}
              <option value="D">D</option> <option value="E">E</option>
            </FormSelect>
          </div>

          <div className="space-y-2">
            <FormLabel>Status</FormLabel>
            <FormSelect
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "Ativo" | "Afastado" | "Férias")
              }
            >
              <option value="Ativo">Ativo</option>
              <option value="Afastado">Afastado</option>
              <option value="Férias">Férias</option>
            </FormSelect>
          </div>
          <Button className="w-full" onClick={handleCreateDriver}>
            {editingId !== null ? "Salvar alterações" : "Salvar motorista"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
