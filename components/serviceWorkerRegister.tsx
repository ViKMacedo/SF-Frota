"use client";

import { useEffect } from "react";
import { clearSession } from "@/services/sessionService";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("SW registro falhou:", err));

      navigator.serviceWorker.addEventListener("message", async (event) => {
        if (event.data?.type === "CLEAR_SESSION") {
          await clearSession();
        }
      });
    }
  }, []);

  return null;
}
