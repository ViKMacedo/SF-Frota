import { db } from "@/lib/db";

export async function getReportsData() {
  const trips = await db.trips.toArray();
  const vehicles = await db.vehicles.toArray();
  const drivers = await db.drivers.toArray();
  const totalTrips = trips.length;
  const finishedTrips = trips.filter(
    (trip) => trip.status === "Finalizada",
  ).length;

  const activeTrips = trips.filter(
    (trip) => trip.status === "Em andamento",
  ).length;

  const totalKm = trips.reduce((acc, trip) => acc + (trip.distance || 0), 0);
  const averageKm = totalTrips > 0 ? Math.round(totalKm / totalTrips) : 0;
  const tripsPerDriver = drivers.map((driver) => ({
    name: driver.name,
    trips: trips.filter((trip) => trip.driverId === driver.id).length,
  }));

  const kmPerVehicle = vehicles.map((vehicle) => ({
    name: vehicle.model,
    km: trips
      .filter((trip) => trip.vehicleId === vehicle.id)
      .reduce((acc, trip) => acc + (trip.distance || 0), 0),
  }));

  return {
    stats: {
      totalTrips,
      finishedTrips,
      activeTrips,
      totalKm,
      averageKm,
    },
    tripsPerDriver,
    kmPerVehicle,
    recentTrips: trips
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      )
      .slice(0, 10),
  };
}
