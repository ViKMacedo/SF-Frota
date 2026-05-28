"use client";

import { useEffect } from "react";

import { seedVehicles } from "@/services/vehicleService";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { saveStorage } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();

  function handleLogin() {
    saveStorage("driver", {
      name: "User",
    });

    router.push("/driver/scan");
  }
  useEffect(() => {
    seedVehicles();
  }, []);
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
            placeholder="Nome do motorista"
            className="h-12 bg-zinc-800 border-zinc-700 text-white"
          />

          <Input
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            maxLength={4}
            className="h-12 bg-zinc-800 border-zinc-700 text-white"
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
