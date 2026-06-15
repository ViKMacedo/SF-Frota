"use client";

import { useRouter } from "next/navigation";
import { clearSession, getSession } from "@/services/sessionService";
import { useEffect, useState } from "react";

type User = {
  name: string;
  role: "admin" | "driver";
};

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        setUser({
          name: session.name,
          role: session.role,
        });
      }
    });
  }, []);
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
