"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { Header } from "@/components/admin/header";
import { KpiCard } from "@/components/admin/kpicard";
import { getActiveTrips } from "@/services/trackingService";

import { Table } from "@/components/admin/table";
import { TableRow } from "@/components/admin/tablerow";
import { TableCell } from "@/components/admin/tablecell";

import type { TrackingTrip } from "@/types/tracking";
import { TrackingDrawer } from "@/components/admin/trackingdrawer";

const TrackingMap = dynamic(
  () => import("@/components/admin/trackingmap").then((mod) => mod.TrackingMap),
  {
    ssr: false,
  },
);
export default function TrackingPage() {
  const [trips, setTrips] = useState<TrackingTrip[]>([]);

  const [selectedTrip, setSelectedTrip] = useState<TrackingTrip | null>(null);
  useEffect(() => {
    async function loadTracking() {
      const data = await getActiveTrips();
      console.log(data);
      setTrips(data);
    }
    loadTracking();
    const interval = setInterval(loadTracking, 5000);
    return () => clearInterval(interval);
  }, []);
  const activeVehicles = trips.length;
  const activeDrivers = new Set(trips.map((trip) => trip.driverName)).size;
  const todayTrips = trips.filter((trip) => {
    const today = new Date().toDateString();
    return new Date(trip.startedAt).toDateString() === today;
  }).length;
  const todayKm = trips.reduce((acc, trip) => acc + (trip.distance || 0), 0);
  function formatDuration(startedAt: string) {
    const start = new Date(startedAt).getTime();

    const now = new Date().getTime();

    const diff = now - start;

    const hours = Math.floor(diff / 1000 / 60 / 60);

    const minutes = Math.floor((diff / 1000 / 60) % 60);

    return `${hours}h ${minutes}min`;
  }
  return (
    <div className="space-y-8">
      {/* Header */}
      <Header
        title="Central operacional"
        description="Monitoramento live da frota"
      />
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <KpiCard title="Veículos em uso" value={String(activeVehicles)} />
        <KpiCard title="Motoristas ativos" value={String(activeDrivers)} />
        <KpiCard title="Usos hoje" value={String(todayTrips)} />
        <KpiCard title="KM hoje" value={`${todayKm} km`} />
      </div>
      {/* Map */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800 mb-8">
        <TrackingMap
          trips={trips}
          selectedTrip={selectedTrip}
          onSelectTrip={setSelectedTrip}
        />
      </div>
      {/* Live KPI */}
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

              <TableCell>{trip.distance || 0} km</TableCell>

              <TableCell>
                <div className="flex items-center gap-2 text-green-400 font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full   animate-pulse" />
                  LIVE
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </div>

      {selectedTrip && (
        <TrackingDrawer
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
        />
      )}
    </div>
  );
}
