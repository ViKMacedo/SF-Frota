import { db, type Vehicle, VehicleStatus } from "@/lib/db";

export async function getVehicles(): Promise<Vehicle[]> {
  return await db.vehicles.toArray();
}

export async function getVehicleById(id: number): Promise<Vehicle | undefined> {
  return await db.vehicles.get(id);
}

export async function seedVehicles() {
  const count = await db.vehicles.count();

  if (count > 0) return;

  await db.vehicles.bulkAdd([
    {
      model: "Fiat Palio",
      plate: "ABC-1234",
      type: "Carro",
      status: "Disponível",
      km: 123456,
    },

    {
      model: "F1000",
      plate: "DEF-5678",
      type: "Caminhonete",
      status: "Disponível",
      km: 123456,
    },
  ]);
}
export async function getVehicleByPlate(
  plate: string,
): Promise<Vehicle | undefined> {
  return await db.vehicles.where("plate").equals(plate).first();
}
export async function updateVehicleStatus(id: number, status: VehicleStatus) {
  await db.vehicles.update(id, {
    status,
  });
}
export async function createVehicle(vehicle: Omit<Vehicle, "id">) {
  return await db.vehicles.add(vehicle);
}
export async function updateVehicle(id: number, vehicle: Partial<Vehicle>) {
  return await db.vehicles.update(id, vehicle);
}
export async function deleteVehicle(id: number) {
  return await db.vehicles.delete(id);
}
