import { supabase } from "@/lib/supabase";

import { getPendingQueue, markAsSynced } from "@/services/syncQueueService";
import { type VehicleQueueItem, type SyncQueueItem, db } from "@/lib/db";

async function syncVehicle(item: VehicleQueueItem) {
  const { payload } = item;

  try {
    const { error } = await supabase.from("vehicles").upsert(
      {
        model: payload.model,
        plate: payload.plate,
        type: payload.type,
        status: payload.status,
        km: payload.km,
        last_driver: payload.lastDriver,
        last_used_at: payload.lastUsedAt,
      },
      {
        onConflict: "plate",
      },
    );

    if (error) {
      throw error;
    }
  } catch (error) {
    console.log("Erro bruto:", error);
    console.log("Tipo:", typeof error);
    console.log("String:", String(error));
    console.dir(error);
    throw error;
  }
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
      }
      await markAsSynced(item.id);
    } catch (error) {
      console.error("Erro sincronizando:", item, error);
      console.log("FILA COMPLETA:", await db.syncQueue.toArray());
    }
  }
}
