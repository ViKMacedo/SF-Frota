"use client";

import { useEffect, useState } from "react";

import { Vehicle, vehicles as initialVehicles } from "@/lib/mockdata";

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    if (typeof window === "undefined") {
      return initialVehicles;
    }
    const storedVehicles = localStorage.getItem("vehicles");
    return storedVehicles ? JSON.parse(storedVehicles) : initialVehicles;
  });

  /*
   * SAVE
   */
  useEffect(() => {
    localStorage.setItem("vehicles", JSON.stringify(vehicles));
  }, [vehicles]);

  /*
   * CREATE
   */
  function addVehicle(vehicle: Omit<Vehicle, "id">) {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: crypto.randomUUID(),
    };

    setVehicles((prev) => [...prev, newVehicle]);
  }

  /*
   * DELETE
   */
  function deleteVehicle(id: string) {
    setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== id));
  }

  /*
   * UPDATE
   */
  function updateVehicle(id: string, updatedVehicle: Omit<Vehicle, "id">) {
    setVehicles((prev) =>
      prev.map((vehicle) =>
        vehicle.id === id
          ? {
              ...vehicle,
              ...updatedVehicle,
            }
          : vehicle,
      ),
    );
  }

  return {
    vehicles,
    addVehicle,
    deleteVehicle,
    updateVehicle,
  };
}
