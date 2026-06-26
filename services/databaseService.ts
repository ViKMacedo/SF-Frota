import { db } from "@/lib/db";

export async function exportBackup() {
  const drivers = await db.drivers.toArray();
  const vehicles = await db.vehicles.toArray();
  const trips = await db.trips.toArray();
  const settings = await db.settings.toArray();
  const backup = {
    exportedAt: new Date().toISOString(),
    drivers,
    vehicles,
    trips,
    settings,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sf-frota-backup-${crypto.randomUUID()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
export async function importBackup(file: File) {
  const text = await file.text();
  const backup = JSON.parse(text);
  await db.transaction(
    "rw",
    db.drivers,
    db.vehicles,
    db.trips,
    db.settings,
    async () => {
      await db.drivers.clear();
      await db.vehicles.clear();
      await db.trips.clear();
      await db.settings.clear();

      if (backup.drivers?.length) {
        await db.drivers.bulkAdd(backup.drivers);
      }

      if (backup.vehicles?.length) {
        await db.vehicles.bulkAdd(backup.vehicles);
      }

      if (backup.trips?.length) {
        await db.trips.bulkAdd(backup.trips);
      }

      if (backup.settings?.length) {
        await db.settings.bulkAdd(backup.settings);
      }
    },
  );
}
export async function resetDatabase() {
  await db.transaction(
    "rw",
    db.drivers,
    db.vehicles,
    db.trips,
    db.settings,
    async () => {
      await db.drivers.clear();
      await db.vehicles.clear();
      await db.trips.clear();
      await db.settings.clear();
    },
  );
}
