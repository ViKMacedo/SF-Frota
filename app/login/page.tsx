"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getDrivers } from "@/services/driverService";
import { ensureAdmin } from "@/services/setupService";

import { MobileLayout } from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { getStorage } from "@/lib/storage";
import { db, type Driver } from "@/lib/db";
import { createSession } from "@/services/sessionService";

export default function LoginPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [, setDrivers] = useState<Driver[]>([]);
  const [pin, setPin] = useState("");

  useEffect(() => {
    ensureAdmin();
  }, []);

  useEffect(() => {
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
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registration: name, pin }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    await createSession(data.driver, data.token);
    await db.drivers.put(data.driver);

    if (data.driver.role === "admin") {
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
