"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import dynamic from "next/dynamic";

import { Header } from "@/components/admin/header";
import { KpiCard } from "@/components/admin/kpicard";
import { Table } from "@/components/admin/table";
import { TableRow } from "@/components/admin/tablerow";
import { TableCell } from "@/components/admin/tablecell";
import { TrackingDrawer } from "@/components/admin/trackingdrawer";
import { getActiveTrips } from "@/services/trackingService";

import type { TrackingTrip } from "@/types/tracking";

const TrackingMap = dynamic(
  () => import("@/components/admin/trackingmap").then((mod) => mod.TrackingMap),
  { ssr: false },
);

function formatDuration(startedAt: string) {
  const diff = Date.now() - new Date(startedAt).getTime();
  const hours = Math.floor(diff / 1000 / 60 / 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  return `${hours}h ${minutes}min`;
}

export default function TrackingPage() {
  const [selectedTrip, setSelectedTrip] = useState<TrackingTrip | null>(null);

  // useLiveQuery observa o Dexie em tempo real — sem setInterval
  const trips = useLiveQuery(() => getActiveTrips(), []) ?? [];

  const activeVehicles = trips.length;
  const activeDrivers = new Set(trips.map((t) => t.driverName)).size;
  const todayTrips = trips.filter(
    (t) => new Date(t.startedAt).toDateString() === new Date().toDateString(),
  ).length;
  const todayKm = trips.reduce((acc, t) => acc + (t.distance ?? 0), 0);

  return (
    <div className="space-y-8">
      <Header
        title="Central operacional"
        description="Monitoramento live da frota"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <KpiCard title="Veículos em uso" value={String(activeVehicles)} />
        <KpiCard title="Motoristas ativos" value={String(activeDrivers)} />
        <KpiCard title="Usos hoje" value={String(todayTrips)} />
        <KpiCard title="KM hoje" value={`${todayKm} km`} />
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-800 mb-8">
        <TrackingMap
          trips={trips}
          selectedTrip={selectedTrip}
          onSelectTrip={setSelectedTrip}
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-800 mb-8">
        <Table
          headers={["Motorista", "Veículo", "Início", "Tempo", "KM", "Status"]}
        >
          {trips.map((trip) => (
            <TableRow
              key={trip.id}
              onClick={() => setSelectedTrip(trip)}
              className="cursor-pointer hover:bg-zinc-800/50 transition"
            >
              <TableCell className="font-medium">{trip.driverName}</TableCell>
              <TableCell>{trip.vehicleModel}</TableCell>
              <TableCell>
                {new Date(trip.startedAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell>{formatDuration(trip.startedAt)}</TableCell>
              <TableCell>{trip.distance ?? 0} km</TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-green-400 font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  LIVE
                </div>
              </TableCell>
            </TableRow>
          ))}
          {trips.length === 0 && (
            <TableRow>
              <td colSpan={6} className="text-center py-8 text-zinc-500">
                Nenhum veículo em uso no momento.
              </td>
            </TableRow>
          )}
        </Table>
      </div>

      {selectedTrip && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={() => setSelectedTrip(null)}
          />
          <TrackingDrawer
            trip={selectedTrip}
            onClose={() => setSelectedTrip(null)}
          />
        </>
      )}
    </div>
  );
}
