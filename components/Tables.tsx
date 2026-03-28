import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: string;
};

export function DataTable<T>({ columns, rows, rowKey, empty = "No data" }: Props<T>) {
  if (!rows.length) {
    return <p className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-slate-500">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800 text-sm">
        <thead className="bg-slate-900/80">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 ${c.className || ""}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-slate-900/50">
              {columns.map((c) => (
                <td key={c.key} className={`whitespace-nowrap px-3 py-2 text-slate-200 ${c.className || ""}`}>
                  {c.render
                    ? c.render(row)
                    : String((row as Record<string, unknown>)[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
