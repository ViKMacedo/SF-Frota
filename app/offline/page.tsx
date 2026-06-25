"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4 p-8">
      <div className="text-5xl">📡</div>
      <h1 className="text-2xl font-bold">Sem conexão</h1>
      <p className="text-zinc-400 text-center max-w-xs">
        Você está offline. As viagens em andamento continuam sendo registradas e
        serão sincronizadas quando a conexão voltar.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-medium transition"
      >
        Tentar novamente
      </button>
    </div>
  );
}
