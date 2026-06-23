"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

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
import { syncPendingItems } from "@/services/syncService";

export default function DriversPage() {
  const [showInactive, setShowInactive] = useState(false);
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"admin" | "driver">("driver");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [registration, setRegistration] = useState("");
  const [license, setLicense] = useState<"A" | "B" | "C" | "D" | "E" | "AB">(
    "B",
  );
  const [status, setStatus] = useState<"Ativo" | "Afastado" | "Férias">(
    "Ativo",
  );
  const drivers = useLiveQuery(async () => await getDrivers(), [], []);
  async function handleCreateDriver() {
    if (!name || !registration || !pin || !license) {
      return;
    }
    const driverData = {
      name,
      registration,
      pin,
      role,
      license,
      status,
    };
    if (editingId !== null) {
      await updateDriver(editingId, driverData);
    } else {
      await createDriver(driverData);
    }
    resetForm();
    syncPendingItems();
  }

  function resetForm() {
    setName("");
    setRegistration("");
    setPin("");
    setRole("driver");
    setLicense("B");
    setStatus("Ativo");
    setEditingId(null);
    setOpen(false);
  }

  function handleEditDriver(driver: Driver) {
    setEditingId(driver.id ?? null);
    setName(driver.name);
    setRegistration(driver.registration);
    setPin(driver.pin);
    setRole(driver.role ?? "driver");
    setLicense(driver.license);
    setStatus(driver.status);
    setOpen(true);
    setOpenMenuId(null);
  }
  const ITEMS_PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const filteredDrivers = (drivers ?? []).filter(
    (d) => showInactive || d.status !== "Afastado",
  );
  const totalPages = Math.ceil(filteredDrivers.length / ITEMS_PER_PAGE);
  const paginatedDrivers = filteredDrivers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );
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

      {/* Toggle inativos */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowInactive((v) => !v)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showInactive ? "bg-indigo-600" : "bg-zinc-300"}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${showInactive ? "translate-x-4" : "translate-x-1"}`}
          />
        </button>
        <span className="text-sm text-zinc-500">Mostrar afastados</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto no-scrollbar">
        <Table
          headers={["Nome", "Matrícula", "Perfil", "CNH", "Status", "Ações"]}
        >
          {paginatedDrivers.map((driver) => (
            <TableRow key={driver.id}>
              <TableCell className="font-medium">{driver.name}</TableCell>
              <TableCell>{driver.registration}</TableCell>
              <TableCell>
                {driver.role === "admin" ? "Administrador" : "Motorista"}
              </TableCell>
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
                  label={driver.status}
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
                    setOpenMenuId(null);
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </Table>
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-zinc-500">
            Mostrando{" "}
            {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filteredDrivers.length)}
            {" - "}
            {Math.min(page * ITEMS_PER_PAGE, filteredDrivers.length)}
            {" de "}
            {filteredDrivers.length}
            {" motoristas"}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="
        px-4 py-2 rounded-xl
        bg-zinc-800 text-zinc-300
        hover:bg-zinc-700
        disabled:opacity-40
        disabled:cursor-not-allowed
        transition
      "
            >
              ←
            </button>

            <span className="px-4 py-2 text-sm font-medium text-zinc-400">
              Página {page} de {totalPages || 1}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="
        px-4 py-2 rounded-xl
        bg-indigo-600 text-white
        hover:bg-indigo-500
        disabled:opacity-40
        disabled:cursor-not-allowed
        transition
      "
            >
              →
            </button>
          </div>
        </div>
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
              placeholder="José Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <FormLabel>Usuário</FormLabel>
            <FormInput
              placeholder="Zé"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <FormLabel>PIN</FormLabel>
            <FormInput
              type="password"
              placeholder="1234"
              value={pin}
              maxLength={4}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="space-y-2">
            <FormLabel>Perfil</FormLabel>
            <FormSelect
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "driver")}
            >
              <option value="driver">Motorista</option>
              <option value="admin">Administrador</option>
            </FormSelect>
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
