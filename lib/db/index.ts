import Dexie, { Table } from "dexie";
export interface Trip {
  id?: number;
  vehicleId: number;
  vehicleModel: string;
  vehiclePlate: string;
  driverId: number;
  driverName: string;
  startKm: number;
  endKm?: number;
  distance?: number;
  startedAt: string;
  endedAt?: string;
  duration?: string;
  status: "Em andamento" | "Finalizada";
  synced: boolean;
  lat?: number;
  lng?: number;
  speed?: number;
  statusLabel?: string;
}

export interface Vehicle {
  id?: number;
  model: string;
  plate: string;
  type: "Carro" | "Caminhão" | "Caminhonete";
  status: "Disponível" | "Em uso" | "Em manutenção" | "Inativo";
  km: number;

  lastDriver?: string;
  lastUsedAt?: string;
}

class AppDatabase extends Dexie {
  trips!: Table<Trip>;
  drivers!: Table<Driver>;
  vehicles!: Table<Vehicle>;

  constructor() {
    super("sf-frota-db");
    this.version(3).stores({
      vehicles: "++id, plate, status",
      trips: "++id, vehicleId, status",
      drivers: "++id, name, registration",
    });
  }
}

export const db = new AppDatabase();
export type VehicleStatus =
  | "Disponível"
  | "Em uso"
  | "Em manutenção"
  | "Inativo";

export interface Driver {
  id?: number;
  name: string;
  registration: string;
  license: "A" | "B" | "C" | "D" | "E" | "AB";
  status: "Ativo" | "Afastado" | "Férias";
}
