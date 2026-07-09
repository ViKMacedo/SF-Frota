"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { Header } from "@/components/admin/header";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/admin/formInput";
import { FormLabel } from "@/components/admin/formLabel";
import { FormSelect } from "@/components/admin/formSelect";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { db } from "@/lib/db";
import { saveSettings } from "@/services/settingsService";
import {
  exportBackup,
  importBackup,
  resetDatabase,
} from "@/services/databaseService";

const DEFAULT_FORM = {
  companyName: "SF Frota",
  companyDocument: "",
  companyPhone: "",
  companyEmail: "",
  sessionTimeout: "60",
  allowDeleteDrivers: true,
  allowDeleteVehicles: true,
  allowDeleteTrips: false,
};

export default function SettingsPage() {
  const { toast, showToast, clearToast } = useToast();
  const [importing, setImporting] = useState(false);
  const [overrides, setOverrides] = useState<Partial<typeof DEFAULT_FORM>>({});

  const savedSettings = useLiveQuery(() => db.settings.get("default"), []);

  const form = {
    ...DEFAULT_FORM,
    ...(savedSettings ?? {}),
    ...overrides,
  };

  function update<K extends keyof typeof DEFAULT_FORM>(
    key: K,
    value: (typeof DEFAULT_FORM)[K],
  ) {
    setOverrides((o) => ({ ...o, [key]: value }));
  }

  async function handleSave() {
    await saveSettings({ id: "default", ...form });
    setOverrides({});
    showToast("Configurações salvas com sucesso.", "success");
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      await importBackup(file);
      showToast("Backup importado com sucesso.", "success");
      setTimeout(() => window.location.reload(), 1000);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-8">
      <Toast toast={toast} onClose={clearToast} />

      <Header
        title="Configurações"
        description="Configurações gerais do sistema"
      />

      {/* Empresa */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <h2 className="text-xl font-semibold mb-6">Empresa</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="settings-company-name">
              Nome da empresa
            </FormLabel>
            <FormInput
              id="settings-company-name"
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
            />
          </div>
          <div>
            <FormLabel htmlFor="settings-company-document">CNPJ</FormLabel>
            <FormInput
              id="settings-company-document"
              value={form.companyDocument}
              onChange={(e) => update("companyDocument", e.target.value)}
            />
          </div>
          <div>
            <FormLabel htmlFor="settings-company-phone">Telefone</FormLabel>
            <FormInput
              id="settings-company-phone"
              value={form.companyPhone}
              onChange={(e) => update("companyPhone", e.target.value)}
              maxLength={11}
            />
          </div>
          <div>
            <FormLabel htmlFor="settings-company-email">Email</FormLabel>
            <FormInput
              id="settings-company-email"
              value={form.companyEmail}
              onChange={(e) => update("companyEmail", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Sistema */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <h2 className="text-xl font-semibold mb-6">Sistema</h2>
        <div className="max-w-xs">
          <FormLabel htmlFor="settings-session-timeout">
            Tempo de sessão
          </FormLabel>
          <FormSelect
            id="settings-session-timeout"
            value={form.sessionTimeout}
            onChange={(e) => update("sessionTimeout", e.target.value)}
          >
            <option value="30">30 minutos</option>
            <option value="60">60 minutos</option>
            <option value="120">120 minutos</option>
          </FormSelect>
        </div>
      </div>

      {/* Segurança */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <h2 className="text-xl font-semibold mb-6">Segurança</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span>Permitir exclusão de motoristas</span>
            <input
              type="checkbox"
              checked={form.allowDeleteDrivers}
              onChange={() =>
                update("allowDeleteDrivers", !form.allowDeleteDrivers)
              }
            />
          </label>
          <label className="flex items-center justify-between">
            <span>Permitir exclusão de veículos</span>
            <input
              type="checkbox"
              checked={form.allowDeleteVehicles}
              onChange={() =>
                update("allowDeleteVehicles", !form.allowDeleteVehicles)
              }
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

      {/* Zona de perigo */}
      <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6">
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
            showToast("Sistema resetado.", "success");
            setTimeout(() => window.location.reload(), 1000);
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
