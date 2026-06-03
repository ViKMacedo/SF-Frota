import { db } from "@/lib/db";

export async function seedUsers() {
  const admin = await db.drivers.where("registration").equals("admin").first();

  if (!admin) {
    await db.drivers.add({
      name: "Administrador",
      registration: "admin",
      pin: "1234",
      role: "admin",
      license: "B",
      status: "Ativo",
    });
  }

  const hamilton = await db.drivers
    .where("registration")
    .equals("lh44")
    .first();

  if (!hamilton) {
    await db.drivers.add({
      name: "Lewis Hamilton",
      registration: "lh44",
      pin: "1111",
      role: "driver",
      license: "B",
      status: "Ativo",
    });
  }

  const sainz = await db.drivers.where("registration").equals("c55s").first();

  if (!sainz) {
    await db.drivers.add({
      name: "Carlos Sainz",
      registration: "c55s",
      pin: "2222",
      role: "driver",
      license: "AB",
      status: "Ativo",
    });
  }
}
