"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/admin/formInput";
import { FormLabel } from "@/components/admin/formLabel";
import { FormSelect } from "@/components/admin/formSelect";
import { getSettings, saveSettings } from "@/services/settingsService";
import {
  exportBackup,
  importBackup,
  resetDatabase,
} from "@/services/databaseService";

export default function SettingsPage() {
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("SF Frota");
  const [companyDocument, setCompanyDocument] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [allowDeleteDrivers, setAllowDeleteDrivers] = useState(true);
  const [allowDeleteVehicles, setAllowDeleteVehicles] = useState(true);
  const [allowDeleteTrips, setAllowDeleteTrips] = useState(false);

  async function handleSave() {
    await saveSettings({
      id: 1,
      companyName,
      companyDocument,
      companyPhone,
      companyEmail,
      sessionTimeout,
      allowDeleteDrivers,
      allowDeleteVehicles,
      allowDeleteTrips,
    });

    alert("Configurações salvas com sucesso.");
  }
  useEffect(() => {
    async function loadSettings() {
      const settings = await getSettings();
      setCompanyName(settings.companyName);
      setCompanyDocument(settings.companyDocument);
      setCompanyPhone(settings.companyPhone);
      setCompanyEmail(settings.companyEmail);
      setSessionTimeout(settings.sessionTimeout);
      setAllowDeleteDrivers(settings.allowDeleteDrivers);
      setAllowDeleteVehicles(settings.allowDeleteVehicles);
      setAllowDeleteTrips(settings.allowDeleteTrips);
      setLoading(false);
    }

    loadSettings();
  }, []);
  if (loading) {
    return <div className="text-zinc-500">Carregando configurações...</div>;
  }
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setImporting(true);

      await importBackup(file);

      alert("Backup importado com sucesso.");

      window.location.reload();
    } finally {
      setImporting(false);
    }
  }
  return (
    <div className="space-y-8">
      <Header
        title="Configurações"
        description="Configurações gerais do sistema"
      />

      {/* Empresa */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-10">
        <h2 className="text-xl font-semibold mb-6">Empresa</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <FormLabel>Nome da empresa</FormLabel>
            <FormInput
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <FormLabel>CNPJ</FormLabel>
            <FormInput
              value={companyDocument}
              onChange={(e) => setCompanyDocument(e.target.value)}
            />
          </div>

          <div>
            <FormLabel>Telefone</FormLabel>
            <FormInput
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
            />
          </div>

          <div>
            <FormLabel>Email</FormLabel>
            <FormInput
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Sistema */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-10">
        <h2 className="text-xl font-semibold mb-6">Sistema</h2>
        <div className="max-w-xs">
          <FormLabel>Tempo de sessão</FormLabel>
          <FormSelect
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
          >
            <option value="30">30 minutos</option>
            <option value="60">60 minutos</option>
            <option value="120">120 minutos</option>
          </FormSelect>
        </div>
      </div>

      {/* Segurança */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-10  ">
        <h2 className="text-xl font-semibold mb-6">Segurança</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span>Permitir exclusão de motoristas</span>
            <input
              type="checkbox"
              checked={allowDeleteDrivers}
              onChange={() => setAllowDeleteDrivers(!allowDeleteDrivers)}
            />
          </label>
          <label className="flex items-center justify-between">
            <span>Permitir exclusão de veículos</span>
            <input
              type="checkbox"
              checked={allowDeleteVehicles}
              onChange={() => setAllowDeleteVehicles(!allowDeleteVehicles)}
            />
          </label>
          <label className="flex items-center justify-between">
            <span>Permitir exclusão de utilizações</span>
            <input
              type="checkbox"
              checked={allowDeleteTrips}
              onChange={() => setAllowDeleteTrips(!allowDeleteTrips)}
            />
          </label>
        </div>
      </div>

      {/* Banco */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <h2 className="text-xl font-semibold mb-6">Banco de Dados</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={exportBackup}>
            Exportar Backup
          </Button>

          <label>
            <input type="file" accept=".json" hidden onChange={handleImport} />
            <Button asChild variant="secondary">
              <span>{importing ? "Importando..." : "Importar Backup"}</span>
            </Button>
          </label>
        </div>
      </div>
      <div className="mt-8 border border-red-500/20 bg-red-500/5 rounded-2xl p-6">
        <h3 className="text-red-400 font-semibold mb-2">Zona de Perigo</h3>
        <p className="text-zinc-400 text-sm mb-4">
          Esta ação remove todos os veículos, motoristas, utilizações e
          configurações.
        </p>
        <Button
          variant="destructive"
          onClick={async () => {
            const confirmed = confirm(
              "Tem certeza que deseja apagar todos os dados do sistema?",
            );
            if (!confirmed) return;
            await resetDatabase();
            alert("Sistema resetado.");
            window.location.reload();
          }}
        >
          Resetar Sistema
        </Button>
      </div>
      <div className="flex justify-end">
        <Button
          className="bg-indigo-600 hover:bg-indigo-500"
          onClick={handleSave}
        >
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
