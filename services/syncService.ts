import { supabase } from "@/lib/supabase";

import { getPendingQueue, markAsSynced } from "@/services/syncQueueService";
import { VehicleQueueItem, DriverQueueItem, TripQueueItem, db } from "@/lib/db";

async function syncVehicle(item: VehicleQueueItem) {
  const { payload, operation } = item;

  if (operation === "delete") {
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", payload.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("vehicles").upsert(
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

async function syncDriver(item: DriverQueueItem) {
  const { payload, operation } = item;

  if (operation === "delete") {
    const { error } = await supabase
      .from("drivers")
      .delete()
      .eq("id", payload.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("drivers").upsert(
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

async function syncTrip(item: TripQueueItem) {
  const { payload, operation } = item;

  if (operation === "delete") {
    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("id", payload.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("trips").upsert(
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

export async function syncPendingItems() {
  const items = await getPendingQueue();
  console.log("Itens pendentes:", items);
  for (const item of items) {
    try {
      switch (item.entity) {
        case "vehicle":
          await syncVehicle(item);
          break;

        case "driver":
          await syncDriver(item);
          break;

        case "trip":
          await syncTrip(item);
          break;
      }
      await markAsSynced(item.id);
    } catch (error) {
      console.log("ITEM:");
      console.dir(item, { depth: null });

      console.log("ERROR:");
      console.dir(error, { depth: null });
      console.log("FILA COMPLETA:", await db.syncQueue.toArray());
    }
  }
}
