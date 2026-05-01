import { useState } from "react";
import type { MatrixModel } from "./matrixModel";
import { cn } from "@/lib/utils";

type ViewMode = "heatmap" | "participant";

interface Props {
  model: MatrixModel;
  totalResponses: number;
}

export function ResponseMatrix({ model, totalResponses }: Props) {
  const [view, setView] = useState<ViewMode>("heatmap");

  if (model.rows.length === 0) {
    return (
      <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground bg-background">
        아직 응답이 없습니다
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* View toggle */}
      <div className="flex gap-1 self-end">
        <ViewToggleButton active={view === "heatmap"} onClick={() => setView("heatmap")}>
          🟩 가용 현황
        </ViewToggleButton>
        <ViewToggleButton active={view === "participant"} onClick={() => setView("participant")}>
          👤 참가자별
        </ViewToggleButton>
      </div>

      {view === "heatmap" ? (
        <HeatmapView model={model} totalResponses={totalResponses} />
      ) : (
        <ParticipantView model={model} />
      )}
    </div>
  );
}

/* ─── Heatmap view (date × time, with participant names) ─── */

function HeatmapView({ model, totalResponses }: { model: MatrixModel; totalResponses: number }) {
  const { dateGroups, timeGroups, groupedCells } = model;

  return (
    <div className="rounded-xl border bg-background overflow-x-auto">
      <table className="min-w-full text-xs border-collapse">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="sticky left-0 bg-muted/30 text-left font-semibold px-3 py-2 z-10 min-w-[56px]">
              시간
            </th>
            {dateGroups.map((d) => (
              <th key={d.dateYmd} className="px-3 py-2 font-semibold text-center min-w-[110px] border-l border-border/40">
                {d.dateLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeGroups.map((t) => (
            <tr key={t.hhmm} className="border-b last:border-0">
              <td className="sticky left-0 bg-background px-3 py-2 font-medium text-muted-foreground border-r border-border/40">
                {t.hhmm}
              </td>
              {dateGroups.map((d) => {
                const cell = groupedCells[`${d.dateYmd}_${t.hhmm}`];
                if (!cell) {
                  return <td key={d.dateYmd} className="px-2 py-1.5 border-l border-border/40 bg-muted/10" />;
                }
                const ratio = totalResponses > 0 ? cell.count / totalResponses : 0;
                const shown = cell.participantNames.slice(0, 3);
                const overflow = cell.participantNames.length - shown.length;
                return (
                  <td
                    key={d.dateYmd}
                    className={cn("px-2 py-1.5 border-l border-border/40 align-top", heatClass(ratio))}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={cn("font-semibold text-[11px]", cell.count > 0 ? "text-accent-foreground" : "text-muted-foreground")}>
                        {cell.count}/{totalResponses}
                      </span>
                    </div>
                    {cell.count > 0 && (
                      <div className="flex flex-col gap-0.5">
                        {shown.map((name) => (
                          <span key={name} className="block text-[10px] leading-tight truncate max-w-[90px] text-foreground/80">
                            {name}
                          </span>
                        ))}
                        {overflow > 0 && (
                          <span className="text-[10px] text-muted-foreground">+{overflow}명</span>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Participant view (time rows grouped by date, participant columns) ─── */

function ParticipantView({ model }: { model: MatrixModel }) {
  const { dateGroups, timeGroups, groupedCells, rows } = model;

  return (
    <div className="rounded-xl border bg-background overflow-x-auto">
      <table className="min-w-full text-xs border-collapse">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="sticky left-0 bg-muted/30 text-left font-semibold px-3 py-2 z-10 min-w-[80px]">
              날짜 / 시간
            </th>
            {rows.map((r) => (
              <th key={r.responseId} className="px-3 py-2 font-semibold text-center min-w-[72px] border-l border-border/40">
                <span className="block truncate max-w-[64px] mx-auto">{r.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dateGroups.map((d) => (
            <>
              {/* Date group header */}
              <tr key={`header_${d.dateYmd}`} className="bg-muted/30 border-b border-t">
                <td
                  colSpan={rows.length + 1}
                  className="sticky left-0 px-3 py-1 font-semibold text-[11px] text-muted-foreground uppercase tracking-wide"
                >
                  {d.dateLabel}
                </td>
              </tr>
              {/* Time rows for this date */}
              {timeGroups.map((t) => {
                const cell = groupedCells[`${d.dateYmd}_${t.hhmm}`];
                if (!cell) return null;
                return (
                  <tr key={`${d.dateYmd}_${t.hhmm}`} className="border-b last:border-0 hover:bg-muted/10">
                    <td className="sticky left-0 bg-background px-3 py-2 text-muted-foreground border-r border-border/40">
                      {t.hhmm}
                    </td>
                    {rows.map((r) => {
                      const available = r.checks[cell.slotId] ?? false;
                      return (
                        <td key={r.responseId} className="px-2 py-2 text-center border-l border-border/40">
                          {available ? (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-accent text-accent-foreground"
                              aria-label="가능"
                            >
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          ) : (
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/30 align-middle"
                              aria-label="불가"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </>
          ))}
          {/* Footer: per-participant available count */}
          <tr className="bg-muted/20 border-t font-semibold">
            <td className="sticky left-0 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground border-r border-border/40">
              가능 슬롯
            </td>
            {rows.map((r) => {
              const count = Object.values(r.checks).filter(Boolean).length;
              return (
                <td key={r.responseId} className="px-2 py-2 text-center text-[11px] border-l border-border/40">
                  {count}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ─── Helpers ─── */

function ViewToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs rounded-md border transition-colors",
        active
          ? "bg-foreground text-background border-foreground font-semibold"
          : "bg-background text-muted-foreground border-border hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function heatClass(ratio: number): string {
  if (ratio === 0) return "bg-muted/20";
  if (ratio <= 0.25) return "bg-accent/20";
  if (ratio <= 0.5) return "bg-accent/40";
  if (ratio <= 0.75) return "bg-accent/60";
  return "bg-accent/80";
}
