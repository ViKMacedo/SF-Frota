import { db, type Settings, type Trip, type Vehicle } from "@/lib/db";

function mapVehicle(vehicle: {
    id: string;
    model: string;
    plate: string;
    type: "Carro" | "Caminhão" | "Caminhonete";
    status: "Disponível" | "Em uso" | "Em manutenção" | "Inativo";
    km: number;
    last_driver?: string;
    last_used_at?: string;
}): Vehicle {
    return {
        id: vehicle.id,
        model: vehicle.model,
        plate: vehicle.plate,
        type: vehicle.type,
        status: vehicle.status,
        km: vehicle.km,
        lastDriver: vehicle.last_driver,
        lastUsedAt: vehicle.last_used_at,
    };
}

function mapTrip(trip: {
    id: string;
    vehicle_id: string;
    vehicle_model: string;
    vehicle_plate: string;
    driver_id: string;
    driver_name: string;
    start_km: number;
    end_km?: number;
    distance?: number;
    started_at: string;
    ended_at?: string;
    duration?: string;
    status: "Em andamento" | "Finalizada";
    synced: boolean;
    lat?: number;
    lng?: number;
    speed?: number | null;
    status_label?: string | null;
    route?: Array<{
        lat: number;
        lng: number;
        speed: number;
        heading?: number;
        accuracy?: number;
        ts: number;
        accel?: number;
    }>;
}): Trip {
    return {
        id: trip.id,
        vehicleId: trip.vehicle_id,
        vehicleModel: trip.vehicle_model,
        vehiclePlate: trip.vehicle_plate,
        driverId: trip.driver_id,
        driverName: trip.driver_name,
        startKm: trip.start_km,
        endKm: trip.end_km,
        distance: trip.distance,
        startedAt: trip.started_at,
        endedAt: trip.ended_at,
        duration: trip.duration,
        status: trip.status,
        synced: trip.synced,
        lat: trip.lat,
        lng: trip.lng,
        speed: trip.speed ?? undefined,
        statusLabel: trip.status_label ?? undefined,
        route: trip.route ?? [],
    };
}

export async function bootstrapDatabase(token: string) {
    const res = await fetch("/api/bootstrap", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
    });

    if (!res.ok) {
        throw new Error("Falha no bootstrap");
    }

    const data = await res.json();

    const vehicles = data.vehicles.map(mapVehicle);
    const trips = data.trips.map(mapTrip);

    await db.transaction(
        "rw",
        db.drivers,
        db.vehicles,
        db.trips,
        db.settings,
        async () => {
            const unsyncedTrips = await db.trips
                .filter((t) => t.synced === false)
                .toArray();

            await db.drivers.clear();
            await db.vehicles.clear();
            await db.trips.filter((t: Trip) => t.synced !== false).delete();

            await db.drivers.bulkPut(data.drivers);
            await db.vehicles.bulkPut(vehicles);

            const unsyncedIds = new Set(unsyncedTrips.map((t) => t.id));
            const serverTripsToWrite = trips.filter(
                (t: { id: string }) => !unsyncedIds.has(t.id),
            );
            await db.trips.bulkPut(serverTripsToWrite);

            // Salva settings do servidor se existirem
            if (data.settings) {
                await db.settings.put(data.settings as Settings);
            }
        },
    );

    return {
        drivers: data.drivers.length,
        vehicles: vehicles.length,
        trips: trips.length,
        settings: data.settings ? 1 : 0,
    };
}
