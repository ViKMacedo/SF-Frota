import { db, Trip } from "@/lib/db";

export async function createTrip(trip: Omit<Trip, "id">) {
  return await db.trips.add(trip);
}

export async function getTrips() {
  return await db.trips.reverse().toArray();
}

export async function getActiveTrip() {
  return await db.trips.where("status").equals("Em andamento").first();
}

export async function finishTrip(id: number, data: Partial<Trip>) {
  return await db.trips.update(id, {
    ...data,

    status: "Finalizada",
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
