"use client";

import { useState, useMemo } from "react";
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

type SortField = "name" | "registration" | "license" | "status";
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

export default function DriversPage() {
  const driversRaw = useLiveQuery(async () => await getDrivers(), []);
  const loading = driversRaw === undefined;

  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [registration, setRegistration] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"admin" | "driver">("driver");
  const [license, setLicense] = useState<"A" | "B" | "C" | "D" | "E" | "AB">(
    "B",
  );
  const [status, setStatus] = useState<"Ativo" | "Afastado" | "Férias">(
    "Ativo",
  );
  const [page, setPage] = useState(1);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  const filteredDrivers = useMemo(() => {
    const drivers = driversRaw ?? [];
    const q = search.toLowerCase();
    return drivers
      .filter((d) => showInactive || d.status !== "Afastado")
      .filter(
        (d) =>
          !q ||
          d.name.toLowerCase().includes(q) ||
          d.registration.toLowerCase().includes(q) ||
          d.license.toLowerCase().includes(q) ||
          d.status.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        const av = (a[sortField] ?? "").toString().toLowerCase();
        const bv = (b[sortField] ?? "").toString().toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  }, [driversRaw, showInactive, search, sortField, sortDir]);

  const totalPages = Math.ceil(filteredDrivers.length / ITEMS_PER_PAGE);
  const paginatedDrivers = filteredDrivers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  async function handleSaveDriver() {
    if (!name || !registration) return;
    if (!editingId && !pin) return;
    if (pin && !/^\d{4}$/.test(pin)) {
      alert("PIN deve conter apenas 4 dígitos.");
      return;
    }
    if (editingId !== null) {
      const data: Partial<Driver> = {
        name,
        registration,
        role,
        license,
        status,
      };
      if (pin) data.pin = pin;
      await updateDriver(editingId, data);
    } else {
      await createDriver({ name, registration, pin, role, license, status });
    }
    syncPendingItems();
    resetForm();
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
    setPin("");
    setRole(driver.role ?? "driver");
    setLicense(driver.license);
    setStatus(driver.status);
    setOpen(true);
    setOpenMenuId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <Header title="Motoristas" description="Gestão de motoristas" />
        <Button
          className="bg-indigo-600 hover:bg-indigo-500 transition px-5 py-3 rounded-2xl font-medium"
          onClick={() => setOpen(true)}
        >
          Novo motorista
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
            placeholder="Buscar por nome, usuário, CNH..."
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
            Mostrar afastados
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
                key="name"
                onClick={() => toggleSort("name")}
                className="flex items-center hover:text-white transition"
              >
                Nome{" "}
                <SortIcon
                  field="name"
                  sortField={sortField}
                  sortDir={sortDir}
                />
              </button>,
              <button
                key="reg"
                onClick={() => toggleSort("registration")}
                className="flex items-center hover:text-white transition"
              >
                Usuário{" "}
                <SortIcon
                  field="registration"
                  sortField={sortField}
                  sortDir={sortDir}
                />
              </button>,
              "Perfil",
              <button
                key="lic"
                onClick={() => toggleSort("license")}
                className="flex items-center hover:text-white transition"
              >
                CNH{" "}
                <SortIcon
                  field="license"
                  sortField={sortField}
                  sortDir={sortDir}
                />
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
                      if (!driver.id) return;
                      await deleteDriver(driver.id);
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
            {paginatedDrivers.length === 0 && (
              <TableRow>
                <TableCell className="py-10 text-center text-zinc-500">
                  Nenhum motorista encontrado.
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
            : filteredDrivers.length === 0
              ? "Nenhum resultado"
              : `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filteredDrivers.length)} de ${filteredDrivers.length} motoristas`}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Página anterior"
            className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ←
          </button>
          <span className="px-4 py-2 text-sm font-medium text-zinc-400">
            Página {page} de {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label="Próxima página"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            →
          </button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={resetForm}
        title={editingId !== null ? "Editar motorista" : "Novo motorista"}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel htmlFor="driver-name">Nome</FormLabel>
            <FormInput
              id="driver-name"
              placeholder="José Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="driver-registration">Usuário</FormLabel>
            <FormInput
              id="driver-registration"
              placeholder="Zé"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="driver-pin">
              PIN{editingId ? " (deixe em branco para não alterar)" : ""}
            </FormLabel>
            <FormInput
              id="driver-pin"
              type="password"
              placeholder={editingId ? "Novo PIN (opcional)" : "1234"}
              value={pin}
              maxLength={4}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="driver-role">Perfil</FormLabel>
            <FormSelect
              id="driver-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "driver")}
            >
              <option value="driver">Motorista</option>
              <option value="admin">Administrador</option>
            </FormSelect>
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="driver-license">CNH</FormLabel>
            <FormSelect
              id="driver-license"
              value={license}
              onChange={(e) =>
                setLicense(e.target.value as "A" | "B" | "C" | "D" | "E" | "AB")
              }
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </FormSelect>
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="driver-status">Status</FormLabel>
            <FormSelect
              id="driver-status"
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
          <Button className="w-full" onClick={handleSaveDriver}>
            {editingId !== null ? "Salvar alterações" : "Salvar motorista"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
