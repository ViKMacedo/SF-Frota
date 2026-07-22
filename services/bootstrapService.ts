import {
    db,
    type Refuel,
    type Settings,
    type Trip,
    type Vehicle,
} from "@/lib/db";

function mapVehicle(vehicle: {
    id: string;
    model: string;
    plate: string;
    type: "Carro" | "Caminhão" | "Caminhonete";
    status: "Disponível" | "Em uso" | "Em manutenção" | "Inativo";
    km: number;
    last_driver?: string;
    last_used_at?: string;
    consumo_medio_km_l?: number;
    capacidade_tanque_l?: number;
    ultimo_abastecimento_km?: number;
    nivel_combustivel_estimado?: number;
    manutencao?: Vehicle["manutencao"];
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
        consumoMedioKmL: vehicle.consumo_medio_km_l,
        capacidadeTanqueL: vehicle.capacidade_tanque_l,
        ultimoAbastecimentoKm: vehicle.ultimo_abastecimento_km,
        nivelCombustivelEstimado: vehicle.nivel_combustivel_estimado,
        manutencao: vehicle.manutencao ?? undefined,
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

function mapRefuel(refuel: {
    id: string;
    vehicle_id: string;
    trip_id?: string;
    driver_id: string;
    driver_name: string;
    litros: number;
    km_atual: number;
    created_at: string;
}): Refuel {
    return {
        id: refuel.id,
        vehicleId: refuel.vehicle_id,
        tripId: refuel.trip_id ?? undefined,
        driverId: refuel.driver_id,
        driverName: refuel.driver_name,
        litros: refuel.litros,
        kmAtual: refuel.km_atual,
        createdAt: refuel.created_at,
    };
}
export async function bootstrapDatabase(token: string) {
    const res = await fetch("/api/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    });

    if (!res.ok) {
        throw new Error("Falha no bootstrap");
    }

    const data = await res.json();

    const vehicles = data.vehicles.map(mapVehicle);
    const trips = data.trips.map(mapTrip);
    const refuels = (data.refuels ?? []).map(mapRefuel);

    await db.transaction(
        "rw",
        [
            db.drivers,
            db.vehicles,
            db.trips,
            db.settings,
            db.refuels,
            db.syncQueue,
        ],
        async () => {
            // Coleta os IDs de cada entidade que ainda têm alterações pendentes
            // de sincronização — esses registros NÃO podem ser sobrescritos pelo
            // snapshot do servidor, senão a edição local se perde silenciosamente.
            const pendingQueue = await db.syncQueue
                .filter((item) => !item.synced)
                .toArray();

            const pendingIdsByEntity = {
                driver: new Set(
                    pendingQueue.filter((i) => i.entity === "driver").map((i) =>
                        i.payload.id
                    ),
                ),
                vehicle: new Set(
                    pendingQueue.filter((i) => i.entity === "vehicle").map((
                        i,
                    ) => i.payload.id),
                ),
                trip: new Set(
                    pendingQueue.filter((i) => i.entity === "trip").map((i) =>
                        i.payload.id
                    ),
                ),
                refuel: new Set(
                    pendingQueue.filter((i) => i.entity === "refuel").map((i) =>
                        i.payload.id
                    ),
                ),
            };

            await db.drivers
                .filter((d) => !pendingIdsByEntity.driver.has(d.id))
                .delete();
            await db.vehicles
                .filter((v) => !pendingIdsByEntity.vehicle.has(v.id))
                .delete();
            await db.trips
                .filter((t) => !pendingIdsByEntity.trip.has(t.id!))
                .delete();
            await db.refuels
                .filter((r) => !pendingIdsByEntity.refuel.has(r.id!))
                .delete();

            await db.drivers.bulkPut(
                data.drivers.filter((d: { id: string }) =>
                    !pendingIdsByEntity.driver.has(d.id)
                ),
            );
            await db.vehicles.bulkPut(
                vehicles.filter((v: Vehicle) =>
                    !pendingIdsByEntity.vehicle.has(v.id!)
                ),
            );
            await db.refuels.bulkPut(
                refuels.filter((r: Refuel) =>
                    !pendingIdsByEntity.refuel.has(r.id!)
                ),
            );
            await db.trips.bulkPut(
                trips.filter((t: { id: string }) =>
                    !pendingIdsByEntity.trip.has(t.id)
                ),
            );

            if (data.settings) {
                await db.settings.put(data.settings as Settings);
            }
        },
    );

    return {
        drivers: data.drivers.length,
        vehicles: vehicles.length,
        trips: trips.length,
        refuels: refuels.length,
        settings: data.settings ? 1 : 0,
    };
}
