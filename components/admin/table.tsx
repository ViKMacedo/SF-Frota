import { ReactNode } from "react";

interface TableProps {
  headers: (string | ReactNode)[];
  children: ReactNode;
}

export function Table({ headers, children }: TableProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-visible">
      <table className="w-full">
        <thead className="border-b border-zinc-800 text-zinc-500 text-sm">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="text-left px-6 py-4 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
