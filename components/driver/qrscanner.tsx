"use client";

import { useEffect } from "react";

import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

// tenta traduzir usando os ids publicos da lib, entra como acessibilidade
const TRANSLATIONS: Record<string, string> = {
  "Request Camera Permissions": "Habilitar câmera",
  "Start Scanning": "Iniciar leitura",
  "Stop Scanning": "Parar leitura",
  "Requesting camera permissions...": "Solicitando acesso à câmera...",
};

function translateNode(node: Element) {
  const text = node.textContent?.trim();
  if (text && TRANSLATIONS[text]) {
    node.textContent = TRANSLATIONS[text];
  }
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
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        videoConstraints: {
          facingMode: "environment",
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

    // alterna entre iniciar/parar leitura
    const container = document.getElementById("qr-reader");
    let observer: MutationObserver | undefined;
    if (container) {
      observer = new MutationObserver(() => {
        container.querySelectorAll("button, span").forEach(translateNode);
      });
      observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      observer?.disconnect();
      scanner.clear().catch(() => {});
    };
  }, [onScanSuccess]);

  return (
    <>
      <div id="qr-reader" className="w-full overflow-hidden rounded-3xl" />
      <style jsx global>{`
        #qr-reader {
          border: none !important;
        }
        #qr-reader__scan_region {
          padding-top: 1.5rem;
        }
        #qr-reader__scan_region img {
          opacity: 1 !important;
          width: 56px !important;
          filter: invert(76%) sepia(46%) saturate(638%) hue-rotate(202deg)
            brightness(104%) contrast(96%);
        }
        #qr-reader__dashboard_section {
          padding: 1rem 0.5rem 1.25rem;
        }
        #qr-reader__dashboard_section_csr {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0.75rem;
        }
        #html5-qrcode-button-camera-permission,
        #html5-qrcode-button-camera-start {
          width: 100%;
          min-height: 48px;
          border-radius: 0.75rem;
          border: none;
          background-color: #22c55e;
          color: #052e16;
          font-weight: 700;
          font-size: 0.9375rem;
          cursor: pointer;
          box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.3);
        }
        #html5-qrcode-button-camera-permission:hover,
        #html5-qrcode-button-camera-start:hover {
          background-color: #16a34a;
        }
        #html5-qrcode-button-camera-stop {
          width: 100%;
          min-height: 44px;
          border-radius: 0.75rem;
          border: none;
          background-color: #4f46e5;
          color: #fff;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
        }
        #html5-qrcode-button-camera-stop:hover {
          background-color: #4338ca;
        }
        #html5-qrcode-select-camera {
          width: 100%;
          min-height: 44px;
          border-radius: 0.75rem;
          background-color: #312e81;
          color: #fff;
          border: 1px solid #4338ca;
          padding: 0 0.75rem;
          font-size: 0.875rem;
        }
        #html5-qrcode-button-torch {
          min-height: 44px;
          min-width: 44px;
          border-radius: 0.75rem;
          border: 1px solid #4338ca;
          background-color: transparent;
          color: #a5b4fc;
          margin-left: 0.5rem;
        }
        #qr-reader__header_message {
          border: none !important;
          color: #a5b4fc !important;
          background: transparent !important;
          font-size: 0.875rem !important;
        }
      `}</style>
    </>
  );
}
