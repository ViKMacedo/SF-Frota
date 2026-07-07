import { ReactNode, TdHTMLAttributes } from "react";

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export function TableCell({ children, className, ...props }: TableCellProps) {
  return (
    <td
      {...props}
      className={`
        px-6 py-5
        ${className ?? ""}
      `}
    >
      {children}
    </td>
  );
}
