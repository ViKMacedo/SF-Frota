import { db } from "@/lib/db";

export async function createSession(user: {
  id: string;
  name: string;
  role: "admin" | "driver";
}) {
  await db.sessions.put({
    id: "current",
    userId: user.id,
    name: user.name,
    role: user.role,
    loginAt: new Date().toISOString(),
  });
}

export async function getSession() {
  return await db.sessions.get("current");
}

export async function clearSession() {
  await db.sessions.delete("current");
}
