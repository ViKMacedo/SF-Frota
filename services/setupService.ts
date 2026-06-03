import { db } from "@/lib/db";

export async function ensureAdmin() {
  const count = await db.drivers.count();

  if (count > 0) return;

  await db.drivers.add({
    name: "Administrador",
    registration: "admin",
    pin: "1234",
    role: "admin",
    license: "B",
    status: "Ativo",
  });
}
