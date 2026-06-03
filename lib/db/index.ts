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
  settings!: Table<Settings>;

  constructor() {
    super("sf-frota-db");
    this.version(4).stores({
      vehicles: "++id, plate, status",
      trips: "++id, vehicleId, status",
      drivers: "++id, name, registration",
      settings: "id",
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
  registration: string; // login
  pin: string;
  role: "admin" | "driver";
  license: "A" | "B" | "C" | "D" | "E" | "AB";
  status: "Ativo" | "Afastado" | "Férias";
}
export interface Settings {
  id: number;
  companyName: string;
  companyDocument: string;
  companyPhone: string;
  companyEmail: string;
  sessionTimeout: string;
  allowDeleteDrivers: boolean;
  allowDeleteVehicles: boolean;
  allowDeleteTrips: boolean;
}
