import { db, Driver, Vehicle, Trip } from "@/lib/db";

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
  });
}

export async function getPendingQueue() {
  return await db.syncQueue.filter((item) => !item.synced).toArray();
}
export async function markAsSynced(id: string) {
  console.log("MARCANDO:", id);

  const before = await db.syncQueue.toArray();
  console.log("ANTES UPDATE", before);

  await db.syncQueue.update(id, {
    synced: true,
  });

  const after = await db.syncQueue.toArray();
  console.log("DEPOIS UPDATE", after);
}

export async function removeFromQueue(id: string) {
  await db.syncQueue.delete(id);
}

export async function clearSyncedQueue() {
  const syncedItems = (await db.syncQueue.toArray()).filter(
    (item) => item.synced,
  );
  for (const item of syncedItems) {
    await db.syncQueue.delete(item.id);
  }
}
