"use client";

import { useRouter } from "next/navigation";
import { getStorage } from "@/lib/storage";
import { clearSession } from "@/services/sessionService";

type User = {
  name: string;
  role: "admin" | "driver";
};

export function UserMenu() {
  const router = useRouter();
  const user = getStorage("user") as User | null;
  async function handleLogout() {
    await clearSession();
    router.push("/login");
  }
  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="font-medium text-white">{user.name}</p>
        <p className="text-sm text-zinc-500 capitalize">{user.role}</p>
      </div>
      <button
        onClick={handleLogout}
        className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm"
      >
        Sair
      </button>
    </div>
  );
}
