import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function useAuthGuard(requiredRole: "admin" | "driver") {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const role = session.user.app_metadata?.role;
      if (role !== requiredRole) {
        router.replace(role === "admin" ? "/admin/dashboard" : "/driver/scan");
      }
    }
    check();
  }, [requiredRole, router]);
}
