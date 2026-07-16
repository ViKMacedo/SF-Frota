import type { Driver, Vehicle } from "@/lib/db";

export type RequiredLicenseCategory = "B" | "C";

export function inferRequiredLicense(
  vehicleType: Vehicle["type"],
): RequiredLicenseCategory {
  return vehicleType === "Caminhão" ? "C" : "B";
}

// Hierarquia real de CNH: categorias mais altas cobrem as mais baixas
// (quem tem C também pode dirigir veículo que pede B). "A" é uma categoria
// à parte (motocicleta) e não cobre B/C.
const LICENSE_COVERAGE: Record<Driver["license"], RequiredLicenseCategory[]> = {
  A: [],
  AB: ["B"],
  B: ["B"],
  C: ["B", "C"],
  D: ["B", "C"],
  E: ["B", "C"],
};

export function canDriveVehicle(
  driverLicense: Driver["license"],
  requiredCategory: RequiredLicenseCategory,
): boolean {
  return LICENSE_COVERAGE[driverLicense]?.includes(requiredCategory) ?? false;
}
