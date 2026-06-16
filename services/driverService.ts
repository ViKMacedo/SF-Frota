import { db } from "@/lib/db";
import type { Driver } from "@/lib/db";
import { addDriverToQueue } from "./syncQueueService";

export async function getDrivers() {
  return await db.drivers.toArray();
}

export async function createDriver(driver: Omit<Driver, "id">) {
  const newDriver: Driver = {
    ...driver,
    id: crypto.randomUUID(),
  };
  await db.drivers.add(newDriver);
  await addDriverToQueue("create", newDriver);

  return newDriver.id;
}

export async function updateDriver(id: string, driver: Partial<Driver>) {
  await db.drivers.update(id, driver);
  const updatedDriver = await db.drivers.get(id);
  if (updatedDriver) {
    await addDriverToQueue("update", updatedDriver);
  }
}

export async function deleteDriver(id: string) {
  await updateDriver(id, { status: "Afastado" });
}

export async function getDriverById(id: string) {
  return await db.drivers.get(id);
}
