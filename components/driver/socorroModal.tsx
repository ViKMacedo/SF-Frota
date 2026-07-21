"use client";

import { useState } from "react";
import { X, Truck, Wrench, Fuel, CircleDot, HelpCircle } from "lucide-react";
import type { Trip, Vehicle } from "@/lib/db";

type Categoria = {
  key: string;
  label: string;
  icon: typeof Truck;
};

const CATEGORIAS: Categoria[] = [
  { key: "guincho", label: "Guincho", icon: Truck },
  { key: "mecanico", label: "Mecânico", icon: Wrench },
  { key: "combustivel", label: "Combustível", icon: Fuel },
  { key: "pneu", label: "Pneu", icon: CircleDot },
  { key: "outro", label: "Outro", icon: HelpCircle },
];

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; lat: number; lng: number }
  | { status: "error" };

interface SocorroModalProps {
  open: boolean;
  onClose: () => void;
  trip: Trip;
  vehicle: Vehicle;
  driverName: string;
}

export function SocorroModal({
  open,
  onClose,
  trip,
  driverName,
}: SocorroModalProps) {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [location, setLocation] = useState<LocationState>({ status: "idle" });

  if (!open) return null;

  function handleSelectCategoria(key: string) {
    setCategoria(key);
    setLocation({ status: "loading" });
    if (!navigator.geolocation) {
      setLocation({ status: "error" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          status: "success",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => setLocation({ status: "error" }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  }

  function handleClose() {
    setCategoria(null);
    setDescricao("");
    setLocation({ status: "idle" });
    onClose();
  }

  const categoriaLabel = CATEGORIAS.find((c) => c.key === categoria)?.label;

  const mapsLink =
    location.status === "success"
      ? `https://maps.google.com/?q=${location.lat},${location.lng}`
      : null;

  const mensagem = [
    "*Solicitação de socorro*",
    "",
    `Motorista: ${driverName}`,
    `Veículo: ${trip.vehicleModel} • ${trip.vehiclePlate}`,
    categoriaLabel ? `Categoria: ${categoriaLabel}` : "",
    location.status === "loading"
      ? "Localização: obtendo..."
      : mapsLink
        ? `Localização: ${mapsLink}`
        : "Localização: indisponível",
    descricao ? `Descrição: ${descricao}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  function handleSend() {
    const numero = process.env.NEXT_PUBLIC_SOCORRO_WHATSAPP;
    if (!numero) {
      console.error("NEXT_PUBLIC_SOCORRO_WHATSAPP não configurado");
      return;
    }
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#131526] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white font-semibold text-2xl">Solicitar socorro</p>
          <button
            onClick={handleClose}
            aria-label="Fechar"
            className="text-zinc-500 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!categoria ? (
          <>
            <p className="text-zinc-400 text-lg mb-4">
              Selecione o tipo de ajuda que você precisa.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIAS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => handleSelectCategoria(key)}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition"
                >
                  <Icon className="h-5 w-5 text-red-400" />
                  <span className="text-sm text-white font-medium">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="text-base font-medium text-white mb-2 block">
                Descreva o problema (opcional)
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                placeholder="Ex: pneu furou na BR-101 km 42"
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-2xl p-3 text-base text-white placeholder-zinc-600 resize-none outline-none transition"
              />
            </div>

            <div className="mb-4">
              <p className="text-base font-medium text-white mb-2">
                Prévia da mensagem
              </p>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3  text-zinc-300 whitespace-pre-wrap">
                {mensagem}
              </div>
              {location.status === "loading" && (
                <p className="text-xs text-zinc-500 mt-1.5">
                  Obtendo localização...
                </p>
              )}
              {location.status === "error" && (
                <p className="text-sm text-yellow-500 mt-1.5">
                  Não foi possível obter a localização. A mensagem será enviada
                  sem ela.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleSend}
                disabled={location.status === "loading"}
                className="w-full h-12 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-2xl transition"
              >
                Enviar via WhatsApp
              </button>
              <button
                onClick={() => setCategoria(null)}
                className="w-full h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 font-medium rounded-2xl transition"
              >
                Voltar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
