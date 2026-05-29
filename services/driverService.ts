import { db } from "@/lib/db";
import type { Driver } from "@/lib/db";

export async function getDrivers() {
  return await db.drivers.toArray();
}

export async function createDriver(driver: Omit<Driver, "id">) {
  return await db.drivers.add(driver);
}

export async function updateDriver(id: number, driver: Partial<Driver>) {
  return await db.drivers.update(id, driver);
}

export async function deleteDriver(id: number) {
  return await db.drivers.delete(id);
}

export async function getDriverById(id: number) {
  return await db.drivers.get(id);
}
