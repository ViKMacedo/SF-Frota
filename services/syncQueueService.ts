import { db, Driver, Settings, Trip, Vehicle } from "@/lib/db";

// ✅ Itens que falharem mais de MAX_RETRIES vezes são descartados automaticamente
export const MAX_SYNC_RETRIES = 5;

export async function addDriverToQueue(
  operation: "create" | "update" | "delete",
  payload: Driver,
) {
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entity: "driver",
    operation,
    payload,
    synced: false,
    createdAt: Date.now(),
    retryCount: 0,
  });
}

export async function addVehicleToQueue(
  operation: "create" | "update" | "delete",
  payload: Vehicle,
) {
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entity: "vehicle",
    operation,
    payload,
    synced: false,
    createdAt: Date.now(),
    retryCount: 0,
  });
}

export async function addTripToQueue(
  operation: "create" | "update" | "delete",
  payload: Trip,
) {
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entity: "trip",
    operation,
    payload,
    synced: false,
    createdAt: Date.now(),
    retryCount: 0,
  });
}

export async function addSettingsToQueue(
  operation: "create" | "update" | "delete",
  payload: Settings,
) {
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entity: "settings",
    operation,
    payload,
    synced: false,
    createdAt: Date.now(),
    retryCount: 0,
  });
}

/** Retorna apenas itens que ainda não excederam o limite de retentativas */
export async function getPendingQueue() {
  return await db.syncQueue
    .filter((item) => !item.synced && item.retryCount < MAX_SYNC_RETRIES)
    .toArray();
}

export async function markAsSynced(id: string) {
  await db.syncQueue.delete(id);
}

/** Incrementa retryCount; se exceder MAX_SYNC_RETRIES, descarta o item */
export async function incrementRetry(id: string, error?: string) {
  const item = await db.syncQueue.get(id);
  if (!item) return;
  const newCount = (item.retryCount ?? 0) + 1;
  if (newCount >= MAX_SYNC_RETRIES) {
    console.warn(
      `[Sync] Item ${id} (${item.entity}) descartado após ${MAX_SYNC_RETRIES} tentativas. Último erro: ${
        error ?? "desconhecido"
      }`,
    );
    await db.syncQueue.delete(id);
  } else {
    await db.syncQueue.update(id, { retryCount: newCount, lastError: error });
  }
}

export async function removeFromQueue(id: string) {
  await db.syncQueue.delete(id);
}
