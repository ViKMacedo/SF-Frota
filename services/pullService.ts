import { db, type Trip, type Vehicle } from "@/lib/db";
import { getSession } from "@/services/sessionService";

const LAST_PULL_KEY = "sf-frota:lastPullAt";

function getLastPullAt(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LAST_PULL_KEY);
}

function setLastPullAt(isoDate: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LAST_PULL_KEY, isoDate);
}

function mapVehicle(v: Record<string, unknown>): Vehicle {
    return {
        id: v.id as string,
        model: v.model as string,
        plate: v.plate as string,
        type: v.type as Vehicle["type"],
        status: v.status as Vehicle["status"],
        km: v.km as number,
        lastDriver: v.last_driver as string | undefined,
        lastUsedAt: v.last_used_at as string | undefined,
    };
}

function mapTrip(t: Record<string, unknown>): Trip {
    return {
        id: t.id as string,
        vehicleId: t.vehicle_id as string,
        vehicleModel: t.vehicle_model as string,
        vehiclePlate: t.vehicle_plate as string,
        driverId: t.driver_id as string,
        driverName: t.driver_name as string,
        startKm: t.start_km as number,
        endKm: t.end_km as number | undefined,
        distance: t.distance as number | undefined,
        startedAt: t.started_at as string,
        endedAt: t.ended_at as string | undefined,
        duration: t.duration as string | undefined,
        status: t.status as Trip["status"],
        synced: true,
        lat: t.lat as number | undefined,
        lng: t.lng as number | undefined,
        speed: t.speed as number | undefined,
        statusLabel: t.status_label as string | undefined,
        route: (t.route as Trip["route"]) ?? [],
    };
}

export async function pullFromSupabase() {
    const session = await getSession();
    if (!session?.token) return;

    let res: Response;
    try {
        res = await fetch("/api/pull", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: session.token,
                since: getLastPullAt(),
            }),
        });
    } catch {
        return;
    }

    if (!res.ok) return;

    const { trips, vehicles } = await res.json();

    const mappedTrips = (trips as Record<string, unknown>[]).map(mapTrip);
    const mappedVehicles = (vehicles as Record<string, unknown>[]).map(
        mapVehicle,
    );

    await db.transaction("rw", db.trips, db.vehicles, async () => {
        await db.trips.bulkPut(mappedTrips);
        await db.vehicles.bulkPut(mappedVehicles);
    });

    setLastPullAt(new Date().toISOString());
}
