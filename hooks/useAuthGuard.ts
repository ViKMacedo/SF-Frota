import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/services/sessionService";

export function useAuthGuard(requiredRole: "admin" | "driver") {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const session = await getSession();

      if (!session) {
        router.replace("/login");
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
