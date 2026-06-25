import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function createSession(
  user: {
    id: string;
    name: string;
    role: "admin" | "driver";
    registration: string;
  },
  token: string,
  pin: string,
) {
  const pinHash = await bcrypt.hash(pin, 10);

  await db.sessions.put({
    id: "current",
    userId: user.id,
    name: user.name,
    role: user.role,
    registration: user.registration,
    loginAt: new Date().toISOString(),
    token,
    pinHash,
  });
}

export async function getSession() {
  return await db.sessions.get("current");
}

export async function clearSession() {
  await db.sessions.delete("current");
}
