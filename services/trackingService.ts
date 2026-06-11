import { db } from "@/lib/db";
import type { TrackingTrip } from "@/types/tracking";
import { TRACKING_STATUS } from "@/constants/tracking";

export async function getActiveTrips(): Promise<TrackingTrip[]> {
  const trips = await db.trips.where("status").equals("Em andamento").toArray();

  return trips.map((trip) => {
    const speed = trip.speed ?? 0;

    let statusLabel: string = TRACKING_STATUS.STOPPED;
    if (speed > 5) statusLabel = TRACKING_STATUS.EN_ROUTE;
    if (speed > 70) statusLabel = TRACKING_STATUS.FINISHING;

    return {
      ...trip,
      lat: trip.lat ?? -24.021347,
      lng: trip.lng ?? -48.362951,
      speed,
      statusLabel,
    };
  });
}
