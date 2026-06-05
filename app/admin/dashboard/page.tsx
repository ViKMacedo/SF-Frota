"use client";

import { useEffect, useState } from "react";

import { getDashboardStats, getRecentTrips } from "@/services/dashboardService";

import { StatusBadge } from "@/components/admin/statusbadge";
import { Table } from "@/components/admin/table";
import { TableCell } from "@/components/admin/tablecell";
import { TableRow } from "@/components/admin/tablerow";
import { KpiCard } from "@/components/admin/kpicard";
import { Header } from "@/components/admin/header";
import { Trip } from "@/lib/db";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    totalDrivers: 0,
    totalTrips: 0,
    totalKm: 0,
  });
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      const statsData = await getDashboardStats();

      const tripsData = await getRecentTrips();

      setStats(statsData);

      setRecentTrips(tripsData);
    }

    loadDashboard();
  }, []);

  return (
    <div>
      {/* Header */}
      <Header
        title="Dashboard"
        description="Visão geral da operação da frota"
      />
      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10 mt-8">
        <KpiCard
          title="Carros Disponíveis"
          value={String(stats.availableVehicles)}
        />
        <KpiCard title="Em uso" value={String(stats.activeVehicles)} />
        <KpiCard title="Motoristas" value={String(stats.totalDrivers)} />
        <KpiCard title="Utilizações" value={String(stats.totalTrips)} />
      </div>
      {/* Table */}

      <Table headers={["Motorista", "Veículo", "KM", "Status"]}>
        {recentTrips.map((trip) => (
          <TableRow key={trip.id}>
            <TableCell className="font-medium">{trip.driverName}</TableCell>

            <TableCell>{trip.vehicleModel}</TableCell>

            <TableCell>{trip.distance || 0} km</TableCell>

            <TableCell>
              <StatusBadge
                status={trip.status === "Em andamento" ? "active" : "available"}
              />
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
