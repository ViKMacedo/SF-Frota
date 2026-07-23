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
  const [tanqueCheio, setTanqueCheio] = useState(false);

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
    !semConfiguracao && tanqueCheio
      ? 100
      : !semConfiguracao &&
          litrosNum > 0 &&
          nivelAntesDoAbastecimento !== undefined
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
    if (!tanqueCheio && (!litrosNum || litrosNum <= 0)) {
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
      const { novoNivel } = await registerRefuel({
        vehicleId: vehicle.id,
        tripId,
        driverId,
        driverName,
        litros: tanqueCheio ? undefined : litrosNum,
        // Esse KM é só pra rastrear o combustível — não altera o KM
        kmAtual: kmAbastecidoNum,
        tanqueCheio,
      });
      await syncPendingItems();
      onSuccess?.(novoNivel, kmAbastecidoNum);
      setLitros("");
      setKmAbastecido("");
      setTanqueCheio(false);
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
      <DialogContent className="border border-zinc-800 bg-zinc-950 shadow-2xl text-xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
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
            <div className="space-y-2 text-base">
              <FormLabel htmlFor="refuel-km">KM no odômetro agora</FormLabel>
              <FormInput
                id="refuel-km"
                type="text"
                inputMode="numeric"
                placeholder={String(currentKm)}
                value={kmAbastecido}
                maxLength={6}
                autoFocus
                onChange={(e) =>
                  setKmAbastecido(e.target.value.replace(/\D/g, ""))
                }
              />
              <p className="text-sm text-zinc-500">
                Confira o valor exato no painel do veículo
              </p>
            </div>
            <label className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={tanqueCheio}
                onChange={(e) => {
                  setTanqueCheio(e.target.checked);
                  if (e.target.checked) setLitros("");
                }}
                className="h-4 w-4 rounded accent-green-500"
              />
              <span className="text-base text-white font-medium">
                Enchi o tanque completamente
              </span>
            </label>
            <div
              className={`space-y-2 ${tanqueCheio ? "opacity-40 pointer-events-none" : ""}`}
            >
              <FormLabel htmlFor="refuel-litros">Litros</FormLabel>
              <FormInput
                id="refuel-litros"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={litros}
                disabled={tanqueCheio}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  const truncatedDigits = digits.slice(0, 5);
                  if (!truncatedDigits) {
                    setLitros("");
                    return;
                  }
                  const paddedDigits = truncatedDigits.padStart(3, "0");
                  const integerPart = paddedDigits.slice(0, -2);
                  const decimalPart = paddedDigits.slice(-2);
                  const formattedInteger = Number(integerPart).toString();
                  setLitros(`${formattedInteger},${decimalPart}`);
                }}
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
          <Button
            className="bg-zinc-900 border border-white/10 hover:bg-zinc-850 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-75"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          {!semConfiguracao && (
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-green-500 text-zinc-950 hover:bg-green-400 font-semibold font-bold text-base rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-75"
            >
              {loading ? "Salvando..." : "Confirmar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
