"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getStorage } from "@/lib/storage";

type Role = "admin" | "driver";

export function useAuthGuard(role: Role) {
  const router = useRouter();

  useEffect(() => {
    const user = getStorage("user");

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== role) {
      router.replace("/login");
    }
  }, [router, role]);
}
