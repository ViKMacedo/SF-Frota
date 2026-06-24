"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";

import { MobileLayout } from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

import { db } from "@/lib/db";
import { createSession } from "@/services/sessionService";
import { bootstrapDatabase } from "@/services/bootstrapService";

function LoginForm() {
  const session = useLiveQuery(() => db.sessions.get("current"), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "true";

  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    if (!session) return;
    if (session.role === "admin") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/driver/scan");
    }
  }, [session, router]);

  async function handleLogin() {
    if (!name || !pin) {
      showToast("Preencha usuário e PIN", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration: name, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error ?? "Usuário ou PIN inválidos", "error");
        return;
      }

      await createSession(data.driver, data.token);
      await bootstrapDatabase(data.token);
    } catch {
      showToast("Falha de conexão. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileLayout className="bg-zinc-950">
      <Toast toast={toast} onClose={clearToast} />

      <div className="flex-1 flex flex-col justify-center">
        <Card className="p-8 rounded-3xl shadow-2xl border-zinc-800 bg-zinc-900 text-white">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">SF Frota</h1>
            <p className="text-zinc-400 mt-2">
              Controle de utilização de veículos
            </p>
          </div>

          {expired && (
            <div className="mb-6 px-4 py-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
              Sua sessão expirou. Faça login novamente para continuar.
            </div>
          )}

          <div className="space-y-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Usuário"
              disabled={loading}
            />
            <Input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              type="password"
              placeholder="PIN"
              maxLength={4}
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 rounded-xl text-base font-semibold"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
