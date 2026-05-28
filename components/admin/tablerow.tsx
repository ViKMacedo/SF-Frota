import { ReactNode } from "react";

interface TableRowProps {
  children: ReactNode;
}

export function TableRow({ children }: TableRowProps) {
  return (
    <tr
      className="
        border-b border-zinc-800
        relative
        overflow-visihble
      "
    >
      {children}
    </tr>
  );
}
