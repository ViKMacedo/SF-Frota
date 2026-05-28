import { trips } from "@/lib/mockdata";

export default function TripsPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Utilizações</h1>
          <p className="text-zinc-500 mt-2">Histórico operacional da frota</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-zinc-800 text-zinc-500 text-sm">
            <tr>
              <th className="text-left px-6 py-4">Motorista</th>
              <th className="text-left px-6 py-4">Veículo</th>
              <th className="text-left px-6 py-4">Placa</th>
              <th className="text-left px-6 py-4">KM</th>
              <th className="text-left px-6 py-4">Tempo</th>
              <th className="text-left px-6 py-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {trips.map((trip) => (
              <tr
                key={trip.id}
                className="border-b border-zinc-800 hover:bg-zinc-800/40 transition"
              >
                <td className="px-6 py-5 font-medium">{trip.driver}</td>
                <td className="px-6 py-5">{trip.vehicle}</td>
                <td className="px-6 py-5 text-zinc-400">{trip.plate}</td>
                <td className="px-6 py-5">{trip.km} km</td>
                <td className="px-6 py-5">{trip.duration}</td>
                <td className="px-6 py-5">
                  {trip.status === "active" && (
                    <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm">
                      Em uso
                    </span>
                  )}
                  {trip.status === "finished" && (
                    <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-sm">
                      Finalizado
                    </span>
                  )}
                  {trip.status === "pending" && (
                    <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-sm">
                      Pendente
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
