"use client";

import { supabase } from "@/lib/supabase";
import { syncPendingItems } from "@/services/syncService";
import { getPendingQueue } from "@/services/syncQueueService";

export default function TestPage() {
  return (
    <div className="p-10 flex gap-4">
      <button
        onClick={async () => {
          const { data, error } = await supabase.from("vehicles").select("*");
          console.log("DATA:", data);
          console.log("ERROR:", error);
        }}
        className="bg-blue-600 px-4 py-2 rounded"
      >
        Testar Supabase
      </button>

      <button
        onClick={async () => {
          console.log("ANTES");
          console.log(await getPendingQueue());
          await syncPendingItems();
          console.log("DEPOIS");
          console.log(await getPendingQueue());
        }}
        className="bg-green-600 px-4 py-2 rounded"
      >
        Testar Sync
      </button>
    </div>
  );
}
