"use client";

import { useSyncStatus } from "@/hooks/useSyncStatus";

/**
 * Badge discreto de status de sincronização.
 * Renderiza nada quando tudo está sincronizado (idle).
 */
export function SyncStatusBadge() {
  const { status, pendingCount } = useSyncStatus();

  if (status === "idle") return null;

  if (status === "syncing") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
        Sincronizando...
      </span>
    );
  }

  // status === "pending"
  return (
    <span
      title={`${pendingCount} item(s) aguardando sincronização`}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2.5 py-1 cursor-help"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
      {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
    </span>
  );
}
