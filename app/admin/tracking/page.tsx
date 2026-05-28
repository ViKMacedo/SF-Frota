"use client";

import dynamic from "next/dynamic";

const TrackingMap = dynamic(
  () => import("@/components/admin/trackingmap").then((mod) => mod.TrackingMap),
  {
    ssr: false,
  },
);
export default function TrackingPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Rastreamento</h1>
        <p className="text-zinc-500 mt-2">Monitoramento operacional da frota</p>
      </div>
      {/* Map */}
      <TrackingMap />
    </div>
  );
}
