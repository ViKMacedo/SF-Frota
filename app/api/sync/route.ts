import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import {
    DriverQueueItem,
    SyncQueueItem,
    TripQueueItem,
    VehicleQueueItem,
} from "@/lib/db";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!, // sb_secret_...
);

const ENTITY_ORDER: Record<SyncQueueItem["entity"], number> = {
    driver: 0,
    vehicle: 1,
    trip: 2,
};

export async function POST(req: NextRequest) {
    const { token, items } = (await req.json()) as {
        token: string;
        items: SyncQueueItem[];
    };

    // 1. Valida o token emitido no login
    let role: string | undefined;
    try {
        const secret = new TextEncoder().encode(
            process.env.SUPABASE_JWT_SECRET!,
        );
        const { payload } = await jwtVerify(token, secret);
        role = (payload.app_metadata as { role?: string } | undefined)?.role;
    } catch {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ results: [] });
    }

    // 2. Ordena: drivers -> vehicles -> trips (resolve FK de vehicle_id em trips)
    const sorted = [...items].sort(
        (a, b) => ENTITY_ORDER[a.entity] - ENTITY_ORDER[b.entity],
    );

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const item of sorted) {
        try {
            // 3. Apenas admin pode excluir
            if (item.operation === "delete" && role !== "admin") {
                throw new Error(
                    "Apenas administradores podem excluir registros",
                );
            }

            await processItem(item);
            results.push({ id: item.id, success: true });
        } catch (error) {
            results.push({ id: item.id, success: false, error: String(error) });
        }
    }

    return NextResponse.json({ results });
}

// ─── Processamento por entidade ────────────────────────────────────────────

async function processItem(item: SyncQueueItem) {
    switch (item.entity) {
        case "driver":
            return processDriver(item);
        case "vehicle":
            return processVehicle(item);
        case "trip":
            return processTrip(item);
    }
}

async function processDriver(item: DriverQueueItem) {
    if (item.operation === "delete") {
        const { error } = await supabaseAdmin
            .from("drivers")
            .delete()
            .eq("id", item.payload.id);
        if (error) throw error;
        return;
    }

    const { payload } = item;
    const { error } = await supabaseAdmin.from("drivers").upsert(
        {
            id: payload.id,
            name: payload.name,
            registration: payload.registration,
            pin: payload.pin,
            role: payload.role,
            license: payload.license,
            status: payload.status,
        },
        { onConflict: "id" },
    );
    if (error) throw error;
}

async function processVehicle(item: VehicleQueueItem) {
    if (item.operation === "delete") {
        const { error } = await supabaseAdmin
            .from("vehicles")
            .delete()
            .eq("id", item.payload.id);
        if (error) throw error;
        return;
    }

    const { payload } = item;
    const { error } = await supabaseAdmin.from("vehicles").upsert(
        {
            id: payload.id,
            model: payload.model,
            plate: payload.plate,
            type: payload.type,
            status: payload.status,
            km: payload.km,
            last_driver: payload.lastDriver,
            last_used_at: payload.lastUsedAt,
        },
        { onConflict: "id" },
    );
    if (error) throw error;
}

async function processTrip(item: TripQueueItem) {
    if (item.operation === "delete") {
        const { error } = await supabaseAdmin
            .from("trips")
            .delete()
            .eq("id", item.payload.id);
        if (error) throw error;
        return;
    }

    const { payload } = item;
    const { error } = await supabaseAdmin.from("trips").upsert(
        {
            id: payload.id,
            vehicle_id: payload.vehicleId,
            vehicle_model: payload.vehicleModel,
            vehicle_plate: payload.vehiclePlate,
            driver_id: payload.driverId,
            driver_name: payload.driverName,
            start_km: payload.startKm,
            end_km: payload.endKm,
            distance: payload.distance,
            started_at: payload.startedAt,
            ended_at: payload.endedAt,
            duration: payload.duration,
            status: payload.status,
            synced: true,
            lat: payload.lat,
            lng: payload.lng,
            speed: payload.speed,
            status_label: payload.statusLabel,
        },
        { onConflict: "id" },
    );
    if (error) throw error;
}
