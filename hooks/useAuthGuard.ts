import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getSession } from "@/services/sessionService";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // token malformado — trata como expirado
  }
}

export function useAuthGuard(requiredRole: "admin" | "driver") {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const session = await getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      if (isTokenExpired(session.token)) {
        await clearSession();
        router.replace("/login?expired=true");
        return;
      }

      if (session.role !== requiredRole) {
        router.replace(
          session.role === "admin" ? "/admin/dashboard" : "/driver/scan",
        );
      }
    }
    check();
  }, [requiredRole, router]);
}
