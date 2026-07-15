import Dexie, { Table } from "dexie";

export interface DriverQueueItem {
  id: string;
  entity: "driver";
  operation: "create" | "update" | "delete";
  payload: Driver;
  synced: boolean;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

export interface VehicleQueueItem {
  id: string;
  entity: "vehicle";
  operation: "create" | "update" | "delete";
  payload: Vehicle;
  synced: boolean;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

export interface TripQueueItem {
  id: string;
  entity: "trip";
  operation: "create" | "update" | "delete";
  payload: Trip;
  synced: boolean;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

export interface SettingsQueueItem {
  id: string;
  entity: "settings";
  operation: "create" | "update" | "delete";
  payload: Settings;
  synced: boolean;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

export interface RefuelQueueItem {
  id: string;
  entity: "refuel";
  operation: "create" | "update" | "delete";
  payload: Refuel;
  synced: boolean;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

export type SyncQueueItem =
  | DriverQueueItem
  | VehicleQueueItem
  | TripQueueItem
  | SettingsQueueItem
  | RefuelQueueItem;

export interface RoutePoint {
  lat: number;
  lng: number;
  speed: number; // km/h
  heading?: number; // graus 0-360
  accuracy?: number; // metros
  ts: number; // timestamp ms
  accel?: number; // m/s² resultante (acelerômetro)
}

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
  route?: RoutePoint[];
}

// Histórico de abastecimentos — vinculado ao veículo (não só à viagem),
// já que um veículo pode ser abastecido fora de uma viagem também.
// tripId fica opcional: preenchido quando o abastecimento acontece durante
// uma viagem em andamento, pra rastreabilidade, mas não é obrigatório.
export interface Refuel {
  id: string;
  vehicleId: string;
  tripId?: string;
  driverId: string;
  driverName: string;
  litros: number;
  kmAtual: number;
  createdAt: string; // ISO
}

export type MaintenanceKey = "oleo" | "pneus" | "freios" | "filtros";

export interface MaintenanceItemState {
  intervaloKm: number;
  intervaloDias: number;
  ultimoKm: number;
  ultimaData: string; // ISO date
}

export type MaintenanceState = Record<MaintenanceKey, MaintenanceItemState>;

export interface Vehicle {
  id: string;
  model: string;
  plate: string;
  type: "Carro" | "Caminhão" | "Caminhonete";
  status: "Disponível" | "Em uso" | "Em manutenção" | "Inativo";
  km: number;
  lastDriver?: string;
  lastUsedAt?: string;
  // Configuração usada para estimar o nível de combustível (não é leitura real de sensor)
  consumoMedioKmL?: number;
  capacidadeTanqueL?: number;
  // Estado calculado a partir do último abastecimento registrado + km rodado desde então
  ultimoAbastecimentoKm?: number;
  nivelCombustivelEstimado?: number; // 0-100
  // Manutenção preventiva: intervalo configurado por item + último registro.
  // Vence o que chegar primeiro entre km rodado e tempo decorrido.
  manutencao?: MaintenanceState;
}

export const MAINTENANCE_LABELS: Record<MaintenanceKey, string> = {
  oleo: "Óleo",
  pneus: "Pneus",
  freios: "Freios",
  filtros: "Filtros",
};

class AppDatabase extends Dexie {
  trips!: Table<Trip>;
  drivers!: Table<Driver>;
  vehicles!: Table<Vehicle>;
  settings!: Table<Settings>;
  syncQueue!: Table<SyncQueueItem>;
  sessions!: Table<Session>;
  refuels!: Table<Refuel>;

  constructor() {
    super("sf-frota-db");
    this.version(9).stores({
      vehicles: "id, plate, status",
      trips: "id, vehicleId, status",
      drivers: "id, name, registration",
      settings: "id",
      syncQueue: "id,synced,entity",
      sessions: "id",
    });
    this.version(10).stores({
      vehicles: "id, plate, status",
      trips: "id, vehicleId, status",
      drivers: "id, name, registration",
      settings: "id",
      syncQueue: "id,synced,entity",
      sessions: "id",
      refuels: "id, vehicleId, tripId",
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
  registration: string;
  pin: string;
  pin_hash?: string;
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
  pinHash?: string;
  registration?: string;
}
