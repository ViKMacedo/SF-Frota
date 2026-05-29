import type { Trip } from "@/lib/db";

export type TrackingTrip = Trip & {
  lat: number;
  lng: number;
  speed: number;
  statusLabel: string;
};
