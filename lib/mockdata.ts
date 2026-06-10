export interface Vehicle {
  id: string;
  model: string;
  plate: string;
  km: number;
  status: "Disponível" | "Em uso" | "Em manutenção" | "Inativo";
  lat?: number;
  lng?: number;
  driver?: string;
  speed?: number;
}
export const vehicles: Vehicle[] = [
  {
    id: "1",
    model: "Fiat Palio",
    plate: "ABC-1234",
    km: 124221,
    status: "Em uso",
  },

  {
    id: "2",
    model: "HB20",
    plate: "XYZ-4321",
    km: 88712,
    status: "Disponível",
  },

  {
    id: "3",
    model: "Hilux",
    plate: "GHI-2134",
    km: 16820,
    status: "Em manutenção",
  },
];

export interface Driver {
  id: string;
  name: string;
  pin: string;
  licenseCategory: "A" | "B" | "C" | "D" | "E" | "AB";
  status: "Disponível" | "Em rota" | "Inativo";
  assignedVehicleId: string | null;
}

export const drivers: Driver[] = [
  {
    id: "z",
    name: "Victor",
    pin: "1234",
    licenseCategory: "AB",
    status: "Disponível",
    assignedVehicleId: null,
  },
];

export const trips = [
  {
    id: 1,
    driver: "Victor",
    vehicle: "Fiat Palio Fire",
    plate: "ABC-1234",
    km: 123,
    duration: "2h 14min",
    status: "active",
  },

  {
    id: 2,
    driver: "Carlos",
    vehicle: "Volkswagen Gol",
    plate: "DEF-5678",
    km: 58,
    duration: "1h 02min",
    status: "finished",
  },

  {
    id: 3,
    driver: "Fernando",
    vehicle: "Chevrolet Onix",
    plate: "GHI-9012",
    km: 0,
    duration: "-",
    status: "pending",
  },
];
