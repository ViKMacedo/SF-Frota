"use client";

import { useEffect, useRef } from "react";
import { syncPendingItems } from "@/services/syncService";

export function useAutoSync() {
  const syncInProgress = useRef(false);

  const runSync = async () => {
    if (syncInProgress.current) return;
    try {
      syncInProgress.current = true;
      await syncPendingItems();
    } finally {
      syncInProgress.current = false;
    }
  };

  // Sync ao montar (se já estiver online)
  useEffect(() => {
    if (navigator.onLine) {
      runSync();
    }
  }, []);

  // Sync ao reconectar
  useEffect(() => {
    const handleOnline = async () => {
      await runSync();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) runSync();
    }, 30000);
    return () => clearInterval(interval);
  }, []);
}
