import { getPendingQueue, markAsSynced } from "@/services/syncQueueService";
import { getSession } from "@/services/sessionService";

export async function syncPendingItems() {
  const items = await getPendingQueue();
  if (items.length === 0) return;

  const session = await getSession();
  if (!session?.token) {
    console.warn("[Sync] Sem sessão/token, abortando sync.");
    return;
  }

  const res = await fetch("/api/sync", {
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

  if (!res.ok) {
    console.warn("[Sync] Falha ao chamar /api/sync:", res.status);
    return;
  }

  const { results } = await res.json();

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
      console.warn(`[Sync] Item ${result.id} falhou:`, result.error);
    }
  }
}
