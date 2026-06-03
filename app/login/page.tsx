"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { seedVehicles } from "@/services/vehicleService";
import { getDrivers } from "@/services/driverService";
import { seedUsers } from "@/services/seedUsers";

import { MobileLayout } from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { saveStorage, getStorage } from "@/lib/storage";
import type { Driver } from "@/lib/db";

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    seedVehicles();
    seedUsers();
  }, []);

  const [name, setName] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [pin, setPin] = useState("");

  useEffect(() => {
    seedVehicles();

    async function loadDrivers() {
      const data = await getDrivers();
      setDrivers(data);
    }
    loadDrivers();
  }, []);

  useEffect(() => {
    const user = getStorage("user");
    if (!user) return;
    if (user.role === "admin") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/driver/scan");
    }
  }, [router]);

  async function handleLogin() {
    const drivers = await getDrivers();

    const user = drivers.find(
      (driver) =>
        driver.registration === name &&
        driver.pin === pin &&
        driver.status === "Ativo",
    );

    if (!user) {
      alert("Usuário ou PIN inválido");
      return;
    }

    saveStorage("user", user);

    if (user.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/driver/scan");
    }
  }

  return (
    <MobileLayout>
      <Card className="p-8 rounded-3xl shadow-2xl border-zinc-800 bg-zinc-900 text-white">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">SF Frota</h1>
          <p className="text-zinc-400 mt-2">
            Controle de utilização de veículos
          </p>
        </div>
        <div className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Usuário"
          />
          <Input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            type="password"
            placeholder="PIN"
            maxLength={4}
          />
          <Button
            onClick={handleLogin}
            className="w-full h-12 rounded-xl text-base font-semibold"
          >
            Entrar
          </Button>
        </div>
      </Card>
    </MobileLayout>
  );
}
