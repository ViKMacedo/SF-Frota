import { StatusBadge } from "@/components/admin/statusbadge";
import { Table } from "@/components/admin/table";
import { TableCell } from "@/components/admin/tablecell";
import { TableRow } from "@/components/admin/tablerow";
import { KpiCard } from "@/components/admin/kpicard";
import { Header } from "@/components/admin/header";

export default function AdminDashboardPage() {
  return (
    <div>
      {/* Header */}
      <Header
        title="Dashboard"
        description="Visão geral da operação da frota"
      />
      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <KpiCard title="Veículos ativos" value="12" />
        <KpiCard title="Motoristas ativos" value="3" />
        <KpiCard title="Veículos disponíveis" value="1" />
        <KpiCard title="KM total" value="123 KM" />
      </div>
      {/* Table */}
      <Table
        headers={["Motorista", "Veículo", "Placa", "KM", "Tempo", "Status"]}
      >
        <TableRow>
          <TableCell className="font-medium">Victor</TableCell>
          <TableCell>Fiat Palio</TableCell>
          <TableCell className="text-zinc-400">ABC-1234</TableCell>
          <TableCell>124 km</TableCell>
          <TableCell>2h 14min</TableCell>
          <TableCell>
            <StatusBadge status="active" />
          </TableCell>
        </TableRow>
      </Table>
    </div>
  );
}
