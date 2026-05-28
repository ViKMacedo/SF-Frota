"use client";

import { useEffect, useState } from "react";

import { Trip } from "@/lib/db";
import { getTrips } from "@/services/tripService";
import { Table } from "@/components/admin/table";
import { TableRow } from "@/components/admin/tablerow";
import { TableCell } from "@/components/admin/tablecell";

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  useEffect(() => {
    async function loadTrips() {
      const data = await getTrips();
      setTrips(data);
    }
    loadTrips();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Utilizações</h1>
          <p className="text-zinc-500 mt-2">Histórico operacional da frota</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <Table
          headers={["Motorista", "Veículo", "Placa", "KM", "Tempo", "Status"]}
        >
          {trips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell className="font-medium">{trip.driverName}</TableCell>

              <TableCell>{trip.vehicleModel}</TableCell>

              <TableCell className="text-zinc-400">
                {trip.vehiclePlate}
              </TableCell>

              <TableCell>{trip.distance ?? "-"} km</TableCell>

              <TableCell>{trip.duration ?? "-"}</TableCell>

              <TableCell>
                {trip.status === "Em andamento" ? (
                  <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm">
                    Em uso
                  </span>
                ) : (
                  <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-sm">
                    Finalizado
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </div>
    </div>
  );
}
