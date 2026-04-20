import type { MatrixModel } from "./matrixModel";
import { cn } from "@/lib/utils";

interface Props {
  model: MatrixModel;
  totalResponses: number;
}

export function ResponseMatrix({ model, totalResponses }: Props) {
  if (model.rows.length === 0) {
    return (
      <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground bg-background">
        아직 응답이 없습니다
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="sticky left-0 bg-muted/30 text-left font-semibold px-3 py-2 z-10">
              참가자
            </th>
            {model.slotColumns.map((c) => (
              <th key={c.slotId} className="px-2 py-2 font-semibold text-center min-w-[64px]">
                <div className="text-[10px] text-muted-foreground mb-0.5">{c.dateLabel}</div>
                <div>{c.timeLabel}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => (
            <tr key={row.responseId} className="border-b last:border-0 hover:bg-muted/20">
              <td className="sticky left-0 bg-background px-3 py-2 font-medium">
                <div>{row.name}</div>
                <div className="text-[10px] text-muted-foreground">{formatPhone(row.phone)}</div>
              </td>
              {model.slotColumns.map((c) => (
                <td key={c.slotId} className="px-2 py-2 text-center">
                  <span
                    className={cn(
                      "inline-block w-5 h-5 rounded-sm align-middle",
                      row.checks[c.slotId] ? "bg-accent" : "bg-muted/40"
                    )}
                    aria-label={row.checks[c.slotId] ? "가능" : "불가"}
                  />
                </td>
              ))}
            </tr>
          ))}
          <tr className="bg-muted/20 font-semibold">
            <td className="sticky left-0 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
              가능 인원 / {totalResponses}
            </td>
            {model.slotColumns.map((c) => (
              <td key={c.slotId} className="px-2 py-2 text-center text-[11px]">
                {model.slotCounts[c.slotId] ?? 0}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function formatPhone(raw: string): string {
  if (raw.length === 11) return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
  if (raw.length === 10) return `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
  return raw;
}
