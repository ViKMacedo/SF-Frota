"use client";

import { useLiveQuery } from "dexie-react-hooks";

import { Driver, db } from "@/lib/db";

import {
  createDriver,
  deleteDriver,
  updateDriver,
} from "@/services/driverService";

export function useDrivers() {
  const drivers = useLiveQuery(() => db.drivers.toArray(), []) ?? [];

  async function add(driver: Omit<Driver, "id">) {
    await createDriver(driver);
  }

  async function remove(id: string) {
    await deleteDriver(id);
  }

  async function update(id: string, updatedDriver: Omit<Driver, "id">) {
    await updateDriver(id, updatedDriver);
  }

  return {
    drivers,
    addDriver: add,
    deleteDriver: remove,
    updateDriver: update,
  };
}
