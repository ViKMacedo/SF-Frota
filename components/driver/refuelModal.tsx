"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/admin/formLabel";
import { FormInput } from "@/components/admin/formInput";
import type { Vehicle } from "@/lib/db";
import { estimateFuelLevel, registerRefuel } from "@/services/refuelService";
import { syncPendingItems } from "@/services/syncService";

interface RefuelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle;
  currentKm: number;
  driverId: string;
  driverName: string;
  tripId?: string;
  onSuccess?: (novoNivel: number, kmAbastecido: number) => void;
}

export function RefuelModal({
  open,
  onOpenChange,
  vehicle,
  currentKm,
  driverId,
  driverName,
  tripId,
  onSuccess,
}: RefuelModalProps) {
  const [litros, setLitros] = useState("");
  const [kmAbastecido, setKmAbastecido] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const semConfiguracao = !vehicle.capacidadeTanqueL;

  // Referência mínima aceitável pro km informado: o km conhecido mais
  // recente do veículo (início da viagem, já que não há odômetro ao vivo).
  const kmMinimo = Math.max(currentKm, vehicle.ultimoAbastecimentoKm ?? 0);
  const kmAbastecidoNum = kmAbastecido ? Number(kmAbastecido) : undefined;

  const nivelAntesDoAbastecimento =
    !semConfiguracao && kmAbastecidoNum !== undefined
      ? (estimateFuelLevel(vehicle, kmAbastecidoNum) ?? 0)
      : undefined;

  const litrosNum = Number(litros.replace(",", "."));
  const previewNivel =
    !semConfiguracao && litrosNum > 0 && nivelAntesDoAbastecimento !== undefined
      ? Math.max(
          0,
          Math.min(
            100,
            nivelAntesDoAbastecimento +
              (litrosNum / (vehicle.capacidadeTanqueL as number)) * 100,
          ),
        )
      : undefined;

  async function handleConfirm() {
    if (!litrosNum || litrosNum <= 0) {
      setError("Informe uma quantidade de litros válida.");
      return;
    }
    if (kmAbastecidoNum === undefined || kmAbastecidoNum <= 0) {
      setError("Informe o KM que está no hodômetro do veículo agora.");
      return;
    }
    if (kmAbastecidoNum < kmMinimo) {
      setError(
        `O KM informado não pode ser menor que ${kmMinimo} (KM do início da viagem).`,
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      await registerRefuel({
        vehicleId: vehicle.id,
        tripId,
        driverId,
        driverName,
        litros: litrosNum,
        // Esse KM é só pra rastrear o combustível — não altera o KM
        // final da viagem, que continua sendo registrado à parte no
        // fim do uso.
        kmAtual: kmAbastecidoNum,
      });
      await syncPendingItems();
      onSuccess?.(previewNivel ?? 0, kmAbastecidoNum);
      setLitros("");
      setKmAbastecido("");
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao registrar abastecimento.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setLitros("");
          setKmAbastecido("");
          setError("");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="border border-zinc-800 bg-zinc-950 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">
            Informar abastecimento
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {semConfiguracao
              ? 'Este veículo ainda não tem os campos "Consumo (km/L)" e "Capacidade tanque (L)" preenchidos no cadastro. Peça pro admin preencher esses dois campos antes de registrar.'
              : "Quantos litros foram colocados no tanque?"}
          </DialogDescription>
        </DialogHeader>

        {!semConfiguracao && (
          <div className="space-y-4">
            <div className="space-y-2">
              <FormLabel htmlFor="refuel-km">KM no hodômetro agora</FormLabel>
              <FormInput
                id="refuel-km"
                type="text"
                inputMode="numeric"
                placeholder={String(currentKm)}
                value={kmAbastecido}
                autoFocus
                onChange={(e) =>
                  setKmAbastecido(e.target.value.replace(/\D/g, ""))
                }
              />
              <p className="text-xs text-zinc-500">
                Confira o valor exato no painel do veículo
              </p>
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="refuel-litros">Litros</FormLabel>
              <FormInput
                id="refuel-litros"
                type="text"
                inputMode="decimal"
                placeholder="18"
                value={litros}
                onChange={(e) =>
                  setLitros(e.target.value.replace(/[^0-9,.]/g, ""))
                }
              />
              {previewNivel !== undefined && (
                <p className="text-xs text-zinc-500">
                  Capacidade do tanque: {vehicle.capacidadeTanqueL}L &middot;
                  nível estimado após:{" "}
                  <span className="text-green-400 font-medium">
                    {Math.round(previewNivel)}%
                  </span>
                </p>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}

        <DialogFooter className="border-t-0 bg-transparent">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {!semConfiguracao && (
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-green-500 text-zinc-950 hover:bg-green-400 font-semibold"
            >
              {loading ? "Salvando..." : "Confirmar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
