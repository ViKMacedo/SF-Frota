"use client";

import { useLiveQuery } from "dexie-react-hooks";

import { db, Vehicle } from "@/lib/db";

import {
  createVehicle,
  deleteVehicle,
  updateVehicle,
} from "@/services/vehicleService";

export function useVehicles() {
  const vehicles = useLiveQuery(() => db.vehicles.toArray(), []) ?? [];

  async function addVehicle(vehicle: Omit<Vehicle, "id">) {
    await createVehicle(vehicle);
  }

  async function removeVehicle(id: string) {
    await deleteVehicle(id);
  }

  async function editVehicle(id: string, updatedVehicle: Omit<Vehicle, "id">) {
    await updateVehicle(id, updatedVehicle);
  }

  return {
    vehicles,
    addVehicle,
    deleteVehicle: removeVehicle,
    updateVehicle: editVehicle,
  };
}
