import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import {
    DriverQueueItem,
    Settings,
    SettingsQueueItem,
    SyncQueueItem,
    TripQueueItem,
    VehicleQueueItem,
} from "@/lib/db";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ENTITY_ORDER: Record<SyncQueueItem["entity"], number> = {
    settings: -1,
    driver: 0,
    vehicle: 1,
    trip: 2,
};

const DELETE_FLAG_BY_ENTITY: Record<
    "driver" | "vehicle" | "trip",
    "allowDeleteDrivers" | "allowDeleteVehicles" | "allowDeleteTrips"
> = {
    driver: "allowDeleteDrivers",
    vehicle: "allowDeleteVehicles",
    trip: "allowDeleteTrips",
};

export async function POST(req: NextRequest) {
    let token: string;
    let items: SyncQueueItem[];

    try {
        const body = await req.json();
        token = body.token;
        items = body.items;
    } catch {
        return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

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

    // 2. Ordena: settings -> drivers -> vehicles -> trips (resolve FK de vehicle_id em trips)
    const sorted = [...items].sort(
        (a, b) => ENTITY_ORDER[a.entity] - ENTITY_ORDER[b.entity],
    );

    // 2.1 Busca as configurações de exclusão (allowDeleteDrivers/Vehicles/Trips)
    let settings = DEFAULT_DELETE_SETTINGS;
    try {
        settings = await getDeleteSettings();
    } catch {
        console.warn("[Sync] Falha ao buscar settings, usando defaults.");
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const item of sorted) {
        try {
            // 3. Apenas admin pode excluir, e somente se a flag correspondente permitir
            if (item.operation === "delete") {
                if (role !== "admin") {
                    throw new Error(
                        "Apenas administradores podem excluir registros",
                    );
                }

                if (item.entity !== "settings") {
                    const flag = DELETE_FLAG_BY_ENTITY[item.entity];
                    if (!settings[flag]) {
                        throw new Error(
                            "Exclusão desabilitada nas configurações do sistema",
                        );
                    }
                }
            }

            await processItem(item);
            results.push({ id: item.id, success: true });
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : typeof error === "object" &&
                        error !== null &&
                        "message" in error
                ? String((error as { message: unknown }).message)
                : String(error);
            console.error(`[Sync backend] Item ${item.id} falhou:`, message);
            results.push({ id: item.id, success: false, error: message });
        }
    }

    return NextResponse.json({ results });
}
// ─── Configurações de exclusão ─────────────────────────────────────────────

const DEFAULT_DELETE_SETTINGS: Pick<
    Settings,
    "allowDeleteDrivers" | "allowDeleteVehicles" | "allowDeleteTrips"
> = {
    allowDeleteDrivers: true,
    allowDeleteVehicles: true,
    allowDeleteTrips: false,
};

async function getDeleteSettings() {
    const { data, error } = await supabaseAdmin
        .from("settings")
        .select("allowDeleteDrivers, allowDeleteVehicles, allowDeleteTrips")
        .eq("id", "default")
        .maybeSingle();

    if (error || !data) {
        return DEFAULT_DELETE_SETTINGS;
    }

    return {
        allowDeleteDrivers: data.allowDeleteDrivers ?? true,
        allowDeleteVehicles: data.allowDeleteVehicles ?? true,
        allowDeleteTrips: data.allowDeleteTrips ?? false,
    };
}

// ─── Processamento por entidade ────────────────────────────────────────────

async function processItem(item: SyncQueueItem) {
    switch (item.entity) {
        case "settings":
            return processSettings(item);
        case "driver":
            return processDriver(item);
        case "vehicle":
            return processVehicle(item);
        case "trip":
            return processTrip(item);
    }
}

async function processSettings(item: SettingsQueueItem) {
    if (item.operation === "delete") {
        // Configurações não são excluídas, apenas atualizadas.
        return;
    }

    const { payload } = item;
    const { error } = await supabaseAdmin.from("settings").upsert(
        {
            id: payload.id,
            companyName: payload.companyName,
            companyDocument: payload.companyDocument,
            companyPhone: payload.companyPhone,
            companyEmail: payload.companyEmail,
            sessionTimeout: payload.sessionTimeout,
            allowDeleteDrivers: payload.allowDeleteDrivers,
            allowDeleteVehicles: payload.allowDeleteVehicles,
            allowDeleteTrips: payload.allowDeleteTrips,
        },
        { onConflict: "id" },
    );
    if (error) throw error;
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
    const upsertData = {
        id: payload.id,
        model: payload.model,
        plate: payload.plate,
        type: payload.type,
        status: payload.status,
        km: payload.km,
        last_driver: payload.lastDriver,
        last_used_at: payload.lastUsedAt,
    };

    // Tenta upsert por id primeiro
    const { error } = await supabaseAdmin
        .from("vehicles")
        .upsert(upsertData, { onConflict: "id" });

    if (!error) return;

    // Se falhou por conflito de placa, atualiza o registro existente com aquela placa
    if (error.code === "23505" && error.message.includes("plate")) {
        const { error: updateError } = await supabaseAdmin
            .from("vehicles")
            .update(upsertData)
            .eq("plate", payload.plate);
        if (updateError) throw updateError;
        return;
    }

    throw error;
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
            route: payload.route ?? [],
        },
        { onConflict: "id" },
    );
    if (error) throw error;
}
