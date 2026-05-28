import { ReactNode } from "react";

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export function TableCell({ children, className }: TableCellProps) {
  return (
    <td
      className={`
       px-6 py-5
       ${className || ""}
   `}
    >
      {children}
    </td>
  );
}
