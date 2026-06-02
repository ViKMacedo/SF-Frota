import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Trip } from "@/lib/db";

function formatDate(dateString?: string) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleDateString("pt-BR");
}

function formatTime(dateString?: string) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function exportTripsToPDF(trips: Trip[]) {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("Relatório de Utilizações", 14, 20);

  autoTable(doc, {
    startY: 30,
    head: [
      [
        "Motorista",
        "Veículo",
        "Placa",
        "Data",
        "Início",
        "Fim",
        "KM",
        "Duração",
        "Status",
      ],
    ],
    body: trips.map((trip) => [
      trip.driverName,
      trip.vehicleModel,
      trip.vehiclePlate,
      formatDate(trip.startedAt),
      formatTime(trip.startedAt),
      formatTime(trip.endedAt),
      trip.distance || 0,
      trip.duration || "-",
      trip.status,
    ]),
  });

  doc.save("relatorio-utilizacoes.pdf");
}

export function exportTripsToExcel(trips: Trip[]) {
  const worksheet = XLSX.utils.json_to_sheet(
    trips.map((trip) => ({
      Motorista: trip.driverName,
      Veículo: trip.vehicleModel,
      Placa: trip.vehiclePlate,
      Data: formatDate(trip.startedAt),
      Início: formatTime(trip.startedAt),
      Fim: formatTime(trip.endedAt),
      "KM Inicial": trip.startKm,
      "KM Final": trip.endKm ?? "-",
      "KM Rodado": trip.distance ?? 0,
      Duração: trip.duration ?? "-",
      Status: trip.status,
    })),
  );

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Utilizações");

  XLSX.writeFile(workbook, "relatorio-utilizacoes.xlsx");
}
