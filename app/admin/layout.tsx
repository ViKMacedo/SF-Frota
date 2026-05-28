"use client";

import { Sidebar } from "@/components/admin/sidebar";
import Image from "next/image";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-black text-white">
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
          <div className="bg-zinc-900 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                <Image
                  src="/user.svg"
                  alt="user"
                  width={30}
                  height={30}
                  className="rounded-3xl"
                />
              </div>
              <div>
                <p className="font-medium">Admin</p>
                <p className="text-zinc-500 text-sm">Operação ativa</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
      {/* Content */}
      <main
        className="
          flex-1
          overflow-y-auto
          overflow-x-visible
          p-8
        "
      >
        {children}
      </main>
    </div>
  );
}
