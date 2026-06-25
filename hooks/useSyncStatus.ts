"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export type SyncStatus = "idle" | "syncing" | "pending";

export interface SyncStatusInfo {
    status: SyncStatus;
    pendingCount: number;
}

export function useSyncStatus(): SyncStatusInfo {
    const [isSyncing, setIsSyncing] = useState(false);

    // Observa a fila em tempo real com Dexie live query
    const queueItems = useLiveQuery(() => db.syncQueue.toArray(), []);

    const pendingCount = queueItems?.filter((i) => !i.synced)
        .length ?? 0;

    // Detecta quando o sync está em andamento ouvindo o evento customizado
    useEffect(() => {
        const handleStart = () => setIsSyncing(true);
        const handleEnd = () => setIsSyncing(false);
        window.addEventListener("sf-sync-start", handleStart);
        window.addEventListener("sf-sync-end", handleEnd);
        return () => {
            window.removeEventListener("sf-sync-start", handleStart);
            window.removeEventListener("sf-sync-end", handleEnd);
        };
    }, []);

    let status: SyncStatus = "idle";
    if (isSyncing) status = "syncing";
    else if (pendingCount > 0) status = "pending";

    return { status, pendingCount };
}
