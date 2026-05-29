import { db } from "@/lib/db";

import type { TrackingTrip } from "@/types/tracking";
import { TRACKING_STATUS } from "@/constants/tracking";

export async function getActiveTrips(): Promise<TrackingTrip[]> {
  const trips = await db.trips.where("status").equals("Em andamento").toArray();
  const updatedTrips: TrackingTrip[] = [];
  for (const trip of trips) {
    const currentLat = trip.lat ?? -24.021347;
    const currentLng = trip.lng ?? -48.362951;
    const speed = Math.floor(Math.random() * 90);
    const lat = currentLat + (Math.random() - 0.5) * 0.001;
    const lng = currentLng + (Math.random() - 0.5) * 0.001;
    let statusLabel: string = TRACKING_STATUS.STOPPED;
    if (speed > 5) {
      statusLabel = TRACKING_STATUS.EN_ROUTE;
    }
    if (speed > 70) {
      statusLabel = TRACKING_STATUS.FINISHING;
    }
    const updatedTrip: TrackingTrip = {
      ...trip,
      lat,
      lng,
      speed,
      statusLabel,
    };
    if (trip.id) {
      await db.trips.update(trip.id, {
        lat,
        lng,
        speed,
        statusLabel,
      });
    }
    updatedTrips.push(updatedTrip);
  }
  return updatedTrips;
}
