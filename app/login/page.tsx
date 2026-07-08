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
import {
  clearSession,
  createSession,
  getSession,
} from "@/services/sessionService";
import { bootstrapDatabase } from "@/services/bootstrapService";
import bcrypt from "bcryptjs";

function LoginForm() {
  useEffect(() => {
    // Limpa ao montar normalmente
    clearSession();

    // Limpa quando restaurado do bfcache (gesto voltar no Chrome Android)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        clearSession();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

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
    const trimmedName = name.trim();
    const trimmedPin = pin.trim();

    if (!trimmedName || !trimmedPin) {
      showToast("Preencha usuário e PIN", "warning");
      return;
    }

    setLoading(true);
    try {
      // Tenta login online primeiro
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration: trimmedName, pin: trimmedPin }),
      });

      if (res.ok) {
        const data = await res.json();
        await createSession(data.driver, data.token, pin);
        await bootstrapDatabase(data.token);

        if (data.driver.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/driver/scan");
        }
        return;
      }

      // Online mas credenciais erradas
      if (res.status === 401) {
        const data = await res.json();
        showToast(data.error ?? "Usuário ou PIN inválidos", "error");
        return;
      }

      // tentar offline
      throw new Error("server_error");
    } catch {
      // tenta sessão cacheada
      await tryOfflineLogin(trimmedName, trimmedPin);
    } finally {
      setLoading(false);
    }
  }

  async function tryOfflineLogin(registration: string, pin: string) {
    const session = await getSession();

    if (!session?.pinHash || !session?.registration) {
      showToast(
        "Sem conexão e nenhuma sessão salva para este dispositivo.",
        "error",
      );
      return;
    }

    if (session.registration !== registration) {
      showToast(
        "Sem conexão. Apenas o último usuário logado pode entrar offline.",
        "error",
      );
      return;
    }

    const pinValid = await bcrypt.compare(pin, session.pinHash);
    if (!pinValid) {
      showToast("PIN inválido.", "error");
      return;
    }

    // Verifica se o JWT ainda é válido
    try {
      const payload = JSON.parse(atob(session.token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        showToast(
          "Sessão expirada. Conecte-se à internet para renovar.",
          "error",
        );
        return;
      }
    } catch {
      showToast("Sessão inválida. Conecte-se à internet.", "error");
      return;
    }

    // Login offline aprovado — não faz bootstrap (sem internet)
    showToast("Entrando no modo offline.", "warning");
    setTimeout(() => {
      if (session.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/driver/scan");
      }
    }, 800);
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
