"use client";

import { useEffect } from "react";
import { syncPendingItems } from "@/services/syncService";

export function useAutoSync() {
  useEffect(() => {
    if (navigator.onLine) {
      syncPendingItems();
    }
  }, []);
  useEffect(() => {
    const handleOnline = async () => {
      console.log("Internet restaurada. Sincronizando...");
      await syncPendingItems();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);
}
