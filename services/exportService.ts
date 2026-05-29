import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Trip } from "@/lib/db";

export function exportTripsToPDF(trips: Trip[]) {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("Relatório de viagens", 14, 20);
  autoTable(doc, {
    startY: 30,
    head: [["Motorista", "Veículo", "KM", "Status"]],
    body: trips.map((trip) => [
      trip.driverName,
      trip.vehicleModel,
      `${trip.distance || 0} km`,
      trip.status,
    ]),
  });

  doc.save("relatorio-frota.pdf");
}

export function exportTripsToExcel(trips: Trip[]) {
  const worksheet = XLSX.utils.json_to_sheet(
    trips.map((trip) => ({
      Motorista: trip.driverName,
      Veiculo: trip.vehicleModel,
      KM: trip.distance || 0,
      Status: trip.status,
      Inicio: trip.startedAt,
      Fim: trip.endedAt || "-",
    })),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");
  XLSX.writeFile(workbook, "relatorio-frota.xlsx");
}
