import type { TrackingTrip } from "@/types/tracking";

type Props = {
  trip: TrackingTrip;
  onClose: () => void;
};

const STATUS_COLOR: Record<string, string> = {
  "Em rota": "text-green-400",
  Parado: "text-yellow-400",
  Finalizando: "text-red-400",
};

export function TrackingDrawer({ trip, onClose }: Props) {
  const lastPoint = trip.route?.at(-1);

  return (
    <div
      className="fixed top-0 right-0 h-screen w-[420px] bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 z-[9999] p-8 shadow-2xl overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 font-semibold text-sm tracking-wide">
              LIVE
            </span>
          </div>
          <h2 className="text-2xl font-bold">{trip.vehicleModel}</h2>
          <p className="text-zinc-400 mt-1">{trip.driverName}</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition flex items-center justify-center text-zinc-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Status + velocidade */}
      <div className="space-y-4 mb-8">
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <p className="text-zinc-500 text-sm mb-1">Status operacional</p>
          <h3
            className={`text-lg font-semibold ${STATUS_COLOR[trip.statusLabel] ?? "text-white"}`}
          >
            {trip.statusLabel}
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <p className="text-zinc-500 text-sm mb-1">Velocidade</p>
            <h3 className="text-2xl font-bold">{trip.speed} km/h</h3>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <p className="text-zinc-500 text-sm mb-1">KM rodado</p>
            <h3 className="text-2xl font-bold">{trip.distance || 0}</h3>
          </div>
        </div>
      </div>

      {/* Rota */}
      <div className="space-y-4 mb-8">
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <p className="text-zinc-500 text-sm mb-3">Rota registrada</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Pontos GPS coletados</span>
            <span className="font-bold text-white">
              {trip.route?.length ?? 0}
            </span>
          </div>
          {lastPoint && (
            <>
              <div className="border-t border-zinc-800 my-3" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Último ponto</span>
                  <span className="text-zinc-300">
                    {new Date(lastPoint.ts).toLocaleTimeString("pt-BR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Lat / Lng</span>
                  <span className="text-zinc-300 font-mono text-xs">
                    {lastPoint.lat.toFixed(5)}, {lastPoint.lng.toFixed(5)}
                  </span>
                </div>
                {lastPoint.accuracy != null && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Precisão GPS</span>
                    <span className="text-zinc-300">
                      ±{Math.round(lastPoint.accuracy)} m
                    </span>
                  </div>
                )}
                {lastPoint.accel != null && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Aceleração</span>
                    <span className="text-zinc-300">
                      {lastPoint.accel.toFixed(2)} m/s²
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Infos */}
      <div className="space-y-4">
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <p className="text-zinc-500 text-sm mb-1">Início da utilização</p>
          <h3 className="font-semibold">
            {new Date(trip.startedAt).toLocaleString("pt-BR")}
          </h3>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <p className="text-zinc-500 text-sm mb-1">ID da viagem</p>
          <h3 className="font-semibold text-xs font-mono break-all">
            {trip.id}
          </h3>
        </div>
      </div>
    </div>
  );
}
