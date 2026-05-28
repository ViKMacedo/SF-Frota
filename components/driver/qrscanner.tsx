"use client";

import { useEffect } from "react";

import { Html5QrcodeScanner } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export function QRScanner({ onScanSuccess }: QRScannerProps) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
      },
      false,
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
        scanner.clear();
      },
      (error) => {
        console.log(error);
      },
    );
    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onScanSuccess]);
  return <div id="qr-reader" className="w-full overflow-hidden rounded-3xl" />;
}
