import Dexie, { Table } from "dexie";

export interface DriverQueueItem {
  id: string;
  entity: "driver";
  operation: "create" | "update" | "delete";
  payload: Driver;
  synced: boolean;
  createdAt: number;
}

export interface VehicleQueueItem {
  id: string;
  entity: "vehicle";
  operation: "create" | "update" | "delete";
  payload: Vehicle;
  synced: boolean;
  createdAt: number;
}

export interface TripQueueItem {
  id: string;
  entity: "trip";
  operation: "create" | "update" | "delete";
  payload: Trip;
  synced: boolean;
  createdAt: number;
}
export type SyncQueueItem = DriverQueueItem | VehicleQueueItem | TripQueueItem;
export interface Trip {
  id: string;
  vehicleId: string;
  vehicleModel: string;
  vehiclePlate: string;
  driverId: string;
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
  id: string;
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
  syncQueue!: Table<SyncQueueItem>;
  sessions!: Table<Session>;

  constructor() {
    super("sf-frota-db");
    this.version(7).stores({
      vehicles: "id, plate, status",
      trips: "id, vehicleId, status",
      drivers: "id, name, registration",
      settings: "id",
      syncQueue: "id,synced,entity",
      sessions: "id",
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
  id: string;
  name: string;
  registration: string; // login
  pin: string;
  role: "admin" | "driver";
  license: "A" | "B" | "C" | "D" | "E" | "AB";
  status: "Ativo" | "Afastado" | "Férias";
}
export interface Settings {
  id: string;
  companyName: string;
  companyDocument: string;
  companyPhone: string;
  companyEmail: string;
  sessionTimeout: string;
  allowDeleteDrivers: boolean;
  allowDeleteVehicles: boolean;
  allowDeleteTrips: boolean;
}
export interface Session {
  id: "current";
  userId: string;
  name: string;
  role: "admin" | "driver";
  loginAt: string;
  token: string;
}
