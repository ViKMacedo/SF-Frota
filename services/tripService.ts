import { db, Trip, Vehicle } from "@/lib/db";
import { addTripToQueue, addVehicleToQueue } from "@/services/syncQueueService";

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

  let updatedVehicle: Vehicle | undefined;

  await db.transaction("rw", db.trips, db.vehicles, async () => {
    await db.trips.add(newTrip);

    await db.vehicles.update(trip.vehicleId, {
      status: "Em uso",
    });

    updatedVehicle = await db.vehicles.get(trip.vehicleId);
  });

  await addTripToQueue("create", newTrip);

  if (updatedVehicle) {
    await addVehicleToQueue("update", updatedVehicle);
  }

  return newTrip.id;
}

export async function getTrips() {
  return await db.trips.reverse().toArray();
}

export async function getActiveTrip() {
  return await db.trips.where("status").equals("Em andamento").first();
}

export async function finishTrip(id: string, data: Partial<Trip>) {
  let updatedTrip: Trip | undefined;
  let updatedVehicle: Vehicle | undefined;

  await db.transaction("rw", db.trips, db.vehicles, async () => {
    const trip = await db.trips.get(id);
    if (!trip) return;

    await db.trips.update(id, { ...data, status: "Finalizada" });
    updatedTrip = await db.trips.get(id);

    await db.vehicles.update(trip.vehicleId, {
      status: "Disponível",
      km: data.endKm,
      lastDriver: trip.driverName,
      lastUsedAt: new Date().toISOString(),
    });
    updatedVehicle = await db.vehicles.get(trip.vehicleId);
  });

  // Sync enfileirado fora da transação (fetch não é permitido dentro)
  if (updatedTrip) await addTripToQueue("update", updatedTrip);
  if (updatedVehicle) await addVehicleToQueue("update", updatedVehicle);
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
