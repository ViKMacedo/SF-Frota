import {
  db,
  MAINTENANCE_KEYS,
  type MaintenanceKey,
  type MaintenanceState,
  type Vehicle,
  VehicleStatus,
} from "@/lib/db";
import { addVehicleToQueue } from "@/services/syncQueueService";
import { generateId } from "@/lib/generateId";

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
export async function updateVehicleStatus(
  id: string,
  status: VehicleStatus,
) {
  await updateVehicle(id, { status });
}
export async function createVehicle(vehicle: Omit<Vehicle, "id">) {
  const existing = await getVehicleByPlate(vehicle.plate);
  if (existing) {
    throw new Error(`Já existe um veículo com a placa ${vehicle.plate}.`);
  }

  const newVehicle: Vehicle = {
    ...vehicle,
    id: generateId(),
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
  await updateVehicle(id, { status: "Inativo" });
}
export type VehicleWithUsage = Vehicle & {
  lastDriver: string;
  lastUsedAt?: string;
  totalTrips: number;
  totalKmDriven: number;
};

export async function releaseFromMaintenance(
  id: string,
  completedItems: MaintenanceKey[],
) {
  const vehicle = await db.vehicles.get(id);
  if (!vehicle) {
    throw new Error("Veículo não encontrado");
  }

  const nowIso = new Date().toISOString();

  const manutencao = MAINTENANCE_KEYS.reduce((acc, key) => {
    const existing = vehicle.manutencao?.[key] ?? {
      intervaloKm: 0,
      intervaloDias: 0,
      ultimoKm: 0,
      ultimaData: "",
    };

    acc[key] = completedItems.includes(key)
      ? { ...existing, ultimoKm: vehicle.km, ultimaData: nowIso }
      : existing;

    return acc;
  }, {} as MaintenanceState);

  await updateVehicle(id, {
    status: "Disponível",
    manutencao,
  });
}

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
