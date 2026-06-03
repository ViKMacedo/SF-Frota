"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { getStorage, removeStorage } from "@/lib/storage";

type Props = {
  children: ReactNode;
};

export default function DriverLayout({ children }: Props) {
  useAuthGuard("driver");
  const router = useRouter();
  const user = getStorage("user");
  function logout() {
    removeStorage("user");
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800">
        <div className="px-6 h-16 flex items-center justify-between">
          <h1 className="font-bold">SF Frota</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">{user?.name}</span>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl bg-zinc-800"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
