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

export class SFDatabase extends Dexie {
  trips!: Table<Trip>;
  constructor() {
    super("sf-frota-db");
    this.version(1).stores({
      trips: "++id, vehicleId, startedAt, status, synced",
    });
  }
}
export const db = new SFDatabase();
