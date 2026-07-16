import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import {
    DriverQueueItem,
    RefuelQueueItem,
    Settings,
    SettingsQueueItem,
    SyncQueueItem,
    TripQueueItem,
    VehicleQueueItem,
} from "@/lib/db";
import bcrypt from "bcryptjs";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ENTITY_ORDER: Record<SyncQueueItem["entity"], number> = {
    settings: -1,
    driver: 0,
    vehicle: 1,
    trip: 2,
    refuel: 3,
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

                if (item.entity !== "settings" && item.entity !== "refuel") {
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
        case "refuel":
            return processRefuel(item);
    }
}

async function processSettings(item: SettingsQueueItem) {
    if (item.operation === "delete") return;

    const { payload } = item;
    const { error } = await supabaseAdmin.from("settings").upsert(
        {
            id: 1,
            company_name: payload.companyName,
            company_document: payload.companyDocument,
            company_phone: payload.companyPhone,
            company_email: payload.companyEmail,
            session_timeout: payload.sessionTimeout,
            allow_delete_drivers: payload.allowDeleteDrivers,
            allow_delete_vehicles: payload.allowDeleteVehicles,
            allow_delete_trips: payload.allowDeleteTrips,
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

    const pin_hash = payload.pin_hash ??
        (payload.pin ? await bcrypt.hash(payload.pin, 12) : null);

    if (!pin_hash) {
        throw new Error(
            `Driver ${payload.id}: sem PIN nem hash disponível para persistir`,
        );
    }

    const driverData = {
        id: payload.id,
        name: payload.name,
        registration: payload.registration,
        pin_hash,
        role: payload.role,
        license: payload.license,
        status: payload.status,
    };

    const { error } = await supabaseAdmin
        .from("drivers")
        .upsert(driverData, { onConflict: "id" });

    if (!error) return;
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
        consumo_medio_km_l: payload.consumoMedioKmL,
        capacidade_tanque_l: payload.capacidadeTanqueL,
        ultimo_abastecimento_km: payload.ultimoAbastecimentoKm,
        nivel_combustivel_estimado: payload.nivelCombustivelEstimado,
        manutencao: payload.manutencao ?? null,
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

async function processRefuel(item: RefuelQueueItem) {
    if (item.operation === "delete") {
        const { error } = await supabaseAdmin
            .from("refuels")
            .delete()
            .eq("id", item.payload.id);
        if (error) throw error;
        return;
    }

    const { payload } = item;
    const { error } = await supabaseAdmin.from("refuels").upsert(
        {
            id: payload.id,
            vehicle_id: payload.vehicleId,
            trip_id: payload.tripId ?? null,
            driver_id: payload.driverId,
            driver_name: payload.driverName,
            litros: payload.litros,
            km_atual: payload.kmAtual,
            created_at: payload.createdAt,
        },
        { onConflict: "id" },
    );
    if (error) throw error;
}
