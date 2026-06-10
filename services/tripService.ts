import { db, Trip } from "@/lib/db";
import { addTripToQueue } from "@/services/syncQueueService";

export async function createTrip(trip: Omit<Trip, "id" | "startKm">) {
  const vehicle = await db.vehicles.get(trip.vehicleId);

  if (!vehicle) {
    throw new Error("Veículo não encontrado");
  }

  const newTrip: Trip = {
    ...trip,
    id: crypto.randomUUID(),
    startKm: vehicle.km,
  };

  await db.trips.add(newTrip);
  await addTripToQueue("create", newTrip);
  await db.vehicles.update(trip.vehicleId, {
    status: "Em uso",
  });
  return newTrip.id;
}

export async function getTrips() {
  return await db.trips.reverse().toArray();
}

export async function getActiveTrip() {
  return await db.trips.where("status").equals("Em andamento").first();
}

export async function finishTrip(id: string, data: Partial<Trip>) {
  const trip = await db.trips.get(id);

  if (!trip) {
    return;
  }

  await db.trips.update(id, {
    ...data,
    status: "Finalizada",
  });

  const updatedTrip = await db.trips.get(id);

  if (updatedTrip) {
    await addTripToQueue("update", updatedTrip);
  }

  await db.vehicles.update(trip.vehicleId, {
    status: "Disponível",
    km: data.endKm,

    lastDriver: trip.driverName,
    lastUsedAt: new Date().toISOString(),
  });
}
export async function getLastFinishedTrip() {
  const trips = await db.trips.toArray();
  return trips
    .filter((trip) => trip.status === "Finalizada")
    .sort(
      (a, b) =>
        new Date(b.endedAt || "").getTime() -
        new Date(a.endedAt || "").getTime(),
    )[0];
}
export async function getTripsByVehicle(vehicleId: string) {
  const trips = await db.trips.toArray();
  return trips
    .filter((trip) => trip.vehicleId === vehicleId)
    .sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
}
