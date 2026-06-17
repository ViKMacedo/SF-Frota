"use client";

import { useEffect, useRef } from "react";

export function useAutoSync() {
  const syncInProgress = useRef(false);
  const runSync = async () => {
    if (syncInProgress.current) return;

    try {
      syncInProgress.current = true;
      await runSync();
    } finally {
      syncInProgress.current = false;
    }
  };
  useEffect(() => {
    if (navigator.onLine) {
      runSync();
    }
  });

  useEffect(() => {
    const handleOnline = async () => {
      console.log("Internet restaurada. Sincronizando...");
      await runSync();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        runSync();
      }
    }, 30000);

    return () => clearInterval(interval);
  });
}
