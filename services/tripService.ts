import { db, Trip } from "@/lib/db";

export async function createTrip(trip: Omit<Trip, "id">) {
  const id = await db.trips.add(trip);

  await db.vehicles.update(trip.vehicleId, {
    status: "Em uso",
  });
  return id;
}

export async function getTrips() {
  return await db.trips.reverse().toArray();
}

export async function getActiveTrip() {
  return await db.trips.where("status").equals("Em andamento").first();
}

export async function finishTrip(id: number, data: Partial<Trip>) {
  const trip = await db.trips.get(id);
  if (!trip) {
    return;
  }

  await db.trips.update(id, {
    ...data,
    status: "Finalizada",
  });

  await db.vehicles.update(trip.vehicleId, {
    status: "Disponível",
    km: data.endKm,
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
