import { db } from "@/lib/db";
import type { Settings } from "@/lib/db";
import { addSettingsToQueue } from "@/services/syncQueueService";

export async function getSettings() {
  const settings = await db.settings.get("default");
  if (settings) return settings;

  const defaults: Settings = {
    id: "default",
    companyName: "SF Frota",
    companyDocument: "",
    companyPhone: "",
    companyEmail: "",
    sessionTimeout: "60",
    allowDeleteDrivers: true,
    allowDeleteVehicles: true,
    allowDeleteTrips: false,
  };
  await db.settings.put(defaults);
  return defaults;
}

export async function saveSettings(settings: Settings) {
  await db.settings.put(settings);
  await addSettingsToQueue("update", settings);
}
