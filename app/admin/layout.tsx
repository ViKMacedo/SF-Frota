"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Sidebar } from "@/components/admin/sidebar";
import { getStorage } from "@/lib/storage";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { clearSession } from "@/services/sessionService";

type User = {
  name: string;
  role: "admin" | "driver";
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuthGuard("admin");

  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const storedUser = getStorage("user");
    setUser(storedUser);
  }, []);

  async function handleLogout() {
    await clearSession();
    router.push("/login");
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-72 border-r border-zinc-800 p-6 flex flex-col">
        {/* Logo */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight">SF Frota</h1>
          <p className="text-zinc-500 text-sm mt-1">Plataforma operacional</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <Sidebar href="/admin/dashboard" label="Dashboard" />
          <Sidebar href="/admin/vehicles" label="Veículos" />
          <Sidebar href="/admin/drivers" label="Motoristas" />
          <Sidebar href="/admin/trips" label="Utilizações" />
          <Sidebar href="/admin/tracking" label="Rastreamento" />
          <Sidebar href="/admin/reports" label="Relatórios" />
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-zinc-800">
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="
                w-full
                bg-zinc-900
                rounded-2xl
                p-4
                hover:bg-zinc-800
                transition
                text-left
              "
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                  <Image src="/user.svg" alt="user" width={30} height={30} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user?.name ?? "Administrador"}</p>
                  <p className="text-zinc-500 text-sm">
                    {user?.role === "admin" ? "Administrador" : "Motorista"}
                  </p>
                </div>
              </div>
            </button>
            {menuOpen && (
              <div
                className="
                  absolute
                  bottom-full
                  left-0
                  mb-2
                  w-full
                  overflow-hidden
                  rounded-2xl
                  border
                  border-zinc-800
                  bg-zinc-900
                  shadow-xl
                  z-50
                "
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/admin/settings");
                  }}
                  className="
                    w-full
                    px-4
                    py-3
                    text-left
                    hover:bg-zinc-800
                    transition
                  "
                >
                  ⚙️ Configurações
                </button>
                <button
                  onClick={handleLogout}
                  className="
                    w-full
                    px-4
                    py-3
                    text-left
                    text-red-400
                    hover:bg-zinc-800
                    transition
                  "
                >
                  🚪 Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-black">{children}</main>
    </div>
  );
}
