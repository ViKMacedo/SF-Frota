import { db } from "@/lib/db";
import type { TrackingTrip } from "@/types/tracking";
import { TRACKING_STATUS } from "@/constants/tracking";

export async function getActiveTrips(): Promise<TrackingTrip[]> {
  const trips = await db.trips.where("status").equals("Em andamento").toArray();

  return trips.map((trip) => {
    const speed = trip.speed ?? 0;

    let statusLabel: string = TRACKING_STATUS.STOPPED;
    if (speed > 5) statusLabel = TRACKING_STATUS.EN_ROUTE;
    return {
      ...trip,
      lat: trip.lat,
      lng: trip.lng,
      speed,
      statusLabel,
    };
  });
}

export async function getTodayStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartISO = todayStart.toISOString();

  const todayTrips = await db.trips
    .filter(
      (t) =>
        t.startedAt >= todayStartISO &&
        (t.status === "Em andamento" || t.status === "Finalizada"),
    )
    .toArray();

  const totalTrips = todayTrips.length;
  const totalKm = todayTrips.reduce((acc, t) => acc + (t.distance ?? 0), 0);

  return { totalTrips, totalKm };
}
