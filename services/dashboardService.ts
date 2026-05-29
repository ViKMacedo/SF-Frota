import { db } from "@/lib/db";

export async function getDashboardStats() {
  const vehicles = await db.vehicles.toArray();
  const drivers = await db.drivers.toArray();
  const trips = await db.trips.toArray();
  const availableVehicles = vehicles.filter(
    (v) => v.status === "Disponível",
  ).length;

  const activeVehicles = vehicles.filter((v) => v.status === "Em uso").length;
  const maintenanceVehicles = vehicles.filter(
    (v) => v.status === "Em manutenção",
  ).length;

  const totalKm = trips.reduce((acc, trip) => acc + (trip.distance || 0), 0);

  return {
    totalVehicles: vehicles.length,
    availableVehicles,
    activeVehicles,
    maintenanceVehicles,
    totalDrivers: drivers.length,
    totalTrips: trips.length,
    totalKm,
  };
}
export async function getRecentTrips() {
  const trips = await db.trips.reverse().sortBy("startedAt");
  return trips.slice(0, 5);
}
