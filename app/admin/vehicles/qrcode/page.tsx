"use client";

import QRCode from "qrcode";
import Image from "next/image";
import { useEffect, useState } from "react";

import { getVehicles } from "@/services/vehicleService";
import type { Vehicle } from "@/lib/db";

export default function VehicleQRCodePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [qrCodes, setQrCodes] = useState<Record<number, string>>({});

  useEffect(() => {
    async function loadVehicles() {
      const data = await getVehicles();
      setVehicles(data);

      const generated: Record<number, string> = {};
      for (const vehicle of data) {
        if (!vehicle.id) continue;
        const qr = await QRCode.toDataURL(
          JSON.stringify({
            vehicleId: vehicle.id,
          }),
        );
        generated[vehicle.id] = qr;
      }
      setQrCodes(generated);
    }

    loadVehicles();
  }, []);

  return (
    <div className="p-10 text-white">
      <h1 className="text-4xl font-bold mb-10">QR Codes da Frota</h1>
      <div className="grid grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center"
          >
            <Image
              src={qrCodes[vehicle.id || 0]}
              alt={vehicle.model}
              width={208}
              height={208}
              className="bg-white p-4 rounded-2xl"
            />
            <h2 className="mt-6 text-xl font-bold">{vehicle.model}</h2>

            <p className="text-zinc-400">{vehicle.plate}</p>

            <p className="text-sm text-zinc-500 mt-2">{vehicle.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
