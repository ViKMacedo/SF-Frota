"use client";

import { useEffect, useRef } from "react";
import { pullFromSupabase } from "@/services/pullService";

// Intervalo reduzido — rastreamento de frota precisa de baixa latência
const PULL_INTERVAL_MS = 10_000;

export function useAdminPull() {
    const pulling = useRef(false);

    async function pull() {
        if (pulling.current) return;
        pulling.current = true;
        try {
            await pullFromSupabase();
        } finally {
            pulling.current = false;
        }
    }

    useEffect(() => {
        pull(); // pull imediato ao montar

        const interval = setInterval(pull, PULL_INTERVAL_MS);

        // Pull ao reconectar internet
        window.addEventListener("online", pull);

        // Pull ao voltar o foco na aba (ex: admin trocou de app e voltou)
        function handleVisibility() {
            if (document.visibilityState === "visible") pull();
        }
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            clearInterval(interval);
            window.removeEventListener("online", pull);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);
}
