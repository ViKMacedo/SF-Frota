import { db, type Vehicle, VehicleStatus } from "@/lib/db";
import { addVehicleToQueue } from "@/services/syncQueueService";

export async function getVehicles(): Promise<Vehicle[]> {
  return await db.vehicles.toArray();
}

export async function getVehicleById(id: string): Promise<Vehicle | undefined> {
  return await db.vehicles.get(id);
}

export async function getVehicleByPlate(
  plate: string,
): Promise<Vehicle | undefined> {
  return await db.vehicles.where("plate").equals(plate).first();
}
export async function updateVehicleStatus(id: string, status: VehicleStatus) {
  await db.vehicles.update(id, {
    status,
  });
}
export async function createVehicle(vehicle: Omit<Vehicle, "id">) {
  const newVehicle: Vehicle = {
    ...vehicle,
    id: crypto.randomUUID(),
  };

  await db.vehicles.add(newVehicle);
  await addVehicleToQueue("create", newVehicle);
}
export async function updateVehicle(id: string, vehicle: Partial<Vehicle>) {
  await db.vehicles.update(id, vehicle);
  const updatedVehicle = await db.vehicles.get(id);
  if (updatedVehicle) {
    await addVehicleToQueue("update", updatedVehicle);
  }
}
export async function deleteVehicle(id: string) {
  const vehicle = await db.vehicles.get(id);
  if (!vehicle) return;

  await addVehicleToQueue("delete", vehicle);
  await db.vehicles.delete(id);
}
export type VehicleWithUsage = Vehicle & {
  lastDriver: string;
  lastUsedAt?: string;
  totalTrips: number;
  totalKmDriven: number;
};

export async function getVehiclesWithUsage(): Promise<VehicleWithUsage[]> {
  const vehicles = await db.vehicles.toArray();
  const trips = await db.trips.toArray();

  return vehicles.map((vehicle) => {
    const vehicleTrips = trips.filter((trip) => trip.vehicleId === vehicle.id);

    const lastTrip = vehicleTrips
      .filter((trip) => trip.status === "Finalizada")
      .sort(
        (a, b) =>
          new Date(b.endedAt || "").getTime() -
          new Date(a.endedAt || "").getTime(),
      )[0];

    const totalKmDriven = vehicleTrips.reduce(
      (acc, trip) => acc + (trip.distance || 0),
      0,
    );

    return {
      ...vehicle,
      lastDriver: lastTrip?.driverName || "-",
      lastUsedAt: lastTrip?.endedAt,
      totalTrips: vehicleTrips.length,
      totalKmDriven,
    };
  });
}
