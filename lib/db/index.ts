import Dexie, { Table } from "dexie";
export interface Trip {
  id?: number;
  vehicleId: number;
  vehicleModel: string;
  vehiclePlate: string;
  driverName: string;
  startKm: number;
  endKm?: number;
  distance?: number;
  startedAt: string;
  endedAt?: string;
  duration?: string;
  status: "Em andamento" | "Finalizada";
  synced: boolean;
}

export interface Vehicle {
  id?: number;
  model: string;
  plate: string;
  type: "Carro" | "Caminhão" | "Caminhonete";
  status: "Disponível" | "Em uso" | "Em manutenção" | "Inativo";
  km: number;
}

class AppDatabase extends Dexie {
  trips!: Table<Trip>;

  vehicles!: Table<Vehicle>;

  constructor() {
    super("sf-frota-db");
    this.version(2).stores({
      vehicles: "++id, plate, status",
      trips: "++id, vehicleId, status",
    });
  }
}

export const db = new AppDatabase();
