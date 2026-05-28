interface StatusBadgeProps {
  status: "active" | "available" | "inactive" | "maintenance";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    active: "bg-green-500/10 text-green-400",
    available: "bg-blue-500/10 text-blue-400",
    maintenance: "bg-orange-500/10 text-orange-400",
    inactive: "bg-red-500/10 text-red-400",
  };

  const labels = {
    active: "Em uso",
    available: "Disponível",
    maintenance: "Manutenção",
    inactive: "Inativo",
  };

  return (
    <span
      className={`
        px-3 py-1 rounded-full text-sm
        ${styles[status]}
      `}
    >
      {labels[status]}
    </span>
  );
}
