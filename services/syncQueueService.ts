import { db, Driver, Refuel, Settings, Trip, Vehicle } from "@/lib/db";
import { generateId } from "@/lib/generateId";

// ✅ Itens que falharem mais de MAX_RETRIES vezes são descartados automaticamente
export const MAX_SYNC_RETRIES = 5;

export async function addDriverToQueue(
  operation: "create" | "update" | "delete",
  payload: Driver,
) {
  await db.syncQueue.add({
    id: generateId(),
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
    id: generateId(),
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
    id: generateId(),
    entity: "trip",
    operation,
    payload,
    synced: false,
    createdAt: Date.now(),
    retryCount: 0,
  });
}

/**
 * Enfileira uma atualização de posição (lat/lng/speed/route) de uma trip em
 * andamento. Usa upsert sobre a fila local: se já existe um item pendente de
 * "update" para essa mesma trip (ainda não sincronizado), substitui o
 * payload em vez de criar um novo item.
 */
export async function queueTripPositionUpdate(payload: Trip) {
  const existing = await db.syncQueue
    .filter(
      (item) =>
        !item.synced &&
        item.entity === "trip" &&
        item.operation === "update" &&
        item.payload.id === payload.id,
    )
    .first();

  if (existing) {
    await db.syncQueue.update(existing.id, {
      payload,
      createdAt: Date.now(),
    });
    return;
  }

  await addTripToQueue("update", payload);
}

export async function addSettingsToQueue(
  operation: "create" | "update" | "delete",
  payload: Settings,
) {
  await db.syncQueue.add({
    id: generateId(),
    entity: "settings",
    operation,
    payload,
    synced: false,
    createdAt: Date.now(),
    retryCount: 0,
  });
}

export async function addRefuelToQueue(
  operation: "create" | "update" | "delete",
  payload: Refuel,
) {
  await db.syncQueue.add({
    id: generateId(),
    entity: "refuel",
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
    .filter((item) => !item.synced)
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
