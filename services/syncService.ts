import {
  getPendingQueue,
  incrementRetry,
  markAsSynced,
} from "@/services/syncQueueService";
import { getSession } from "@/services/sessionService";

function emitSyncEvent(name: "sf-sync-start" | "sf-sync-end") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(name));
  }
}

export async function syncPendingItems() {
  const items = await getPendingQueue();
  if (items.length === 0) return;

  const session = await getSession();
  if (!session?.token) {
    console.warn("[Sync] Sem sessão/token, abortando sync.");
    return;
  }

  emitSyncEvent("sf-sync-start");

  try {
    let res: Response;
    try {
      res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: session.token,
          items: items.map(({ id, entity, operation, payload }) => ({
            id,
            entity,
            operation,
            payload,
          })),
        }),
      });
    } catch (networkErr) {
      // Erro de rede — não incrementa retry, será tentado quando voltar online
      console.warn("[Sync] Erro de rede, tentará novamente:", networkErr);
      return; // finally ainda executa, disparando sf-sync-end
    }

    if (!res.ok) {
      console.warn("[Sync] Falha ao chamar /api/sync:", res.status);
      for (const item of items) {
        await incrementRetry(item.id, `HTTP ${res.status}`);
      }
      return;
    }

    const { results } = await res.json();
    console.log("[Sync] resposta do backend:", JSON.stringify(results));

    for (
      const result of results as {
        id: string;
        success: boolean;
        error?: string;
      }[]
    ) {
      if (result.success) {
        await markAsSynced(result.id);
      } else {
        console.error(`[Sync] Item ${result.id} falhou`, result);
        await incrementRetry(result.id, result.error);
      }
    }
  } finally {
    emitSyncEvent("sf-sync-end");
  }
}
