"use client";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function DriverScanPage() {
  const router = useRouter();
  return (
    <MobileLayout>
      <main className="min-h-screen bg-gradient-to-b from-indigo-950 to-indigo-900 text-white text-white max-w-sm mx-auto flex flex-col p-6">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => router.back()}
            className="text-sm text-zinc-400 mb-6"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold">Escanear QR Code</h1>
          <p className="text-zinc-400 mt-2">
            Aponte a câmera para o QR Code vinculado ao veículo
          </p>
        </div>

        {/* Scanner */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-72 h-72 rounded-3xl border border-zinc-800 bg-zinc-900 flex items-center justify-center">
            {/* Corners */}
            <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-green-400 rounded-tl-xl" />
            <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-green-400 rounded-tr-xl" />
            <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-green-400 rounded-bl-xl" />
            <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-green-400 rounded-br-xl" />
            {/* Fake QR */}
            <Image
              src="/QRCode.svg"
              alt="QR Code"
              width={250}
              height={250}
              className="rounded-3xl"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4 mt-10">
          <Button
            onClick={() => router.push("/driver/start")}
            className="w-full h-12 rounded-2xl text-base font-semibold"
          >
            Confirmar veículo
          </Button>
        </div>
      </main>
    </MobileLayout>
  );
}
