interface KpiCardProps {
  title: string;
  value: string | number;
  valueClassName?: string;
}

export function KpiCard({ title, value, valueClassName }: KpiCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 min-w-0">
      <p className="text-zinc-500 mb-3 truncate">{title}</p>
      <h2
        className={`
          text-3xl
          xl:text-4xl
          font-bold
          leading-none
          break-words
          ${valueClassName || ""}
        `}
      >
        {value}
      </h2>
    </div>
  );
}
