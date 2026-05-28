"use client";

import { useEffect, useState } from "react";

import { Driver, drivers as initialDrivers } from "@/lib/mockdata";

export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    if (typeof window === "undefined") {
      return initialDrivers;
    }
    const storedDrivers = localStorage.getItem("drivers");
    return storedDrivers ? JSON.parse(storedDrivers) : initialDrivers;
  });

  useEffect(() => {
    localStorage.setItem("drivers", JSON.stringify(drivers));
  }, [drivers]);

  function addDriver(driver: Omit<Driver, "id">) {
    const newDriver: Driver = {
      ...driver,
      id: Date.now(),
    };
    setDrivers((prev) => [...prev, newDriver]);
  }

  function deleteDriver(id: number) {
    setDrivers((prev) => prev.filter((driver) => driver.id !== id));
  }

  function updateDriver(id: number, updatedDriver: Omit<Driver, "id">) {
    setDrivers((prev) =>
      prev.map((driver) =>
        driver.id === id
          ? {
              ...driver,
              ...updatedDriver,
            }
          : driver,
      ),
    );
  }

  return {
    drivers,
    addDriver,
    deleteDriver,
    updateDriver,
  };
}
