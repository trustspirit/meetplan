import { useState } from "react";
import type { MatchingResult } from "@meetplan/shared";
import type { MatrixModel } from "./matrixModel";
import { cn } from "@/lib/utils";

interface Props {
  matching: MatchingResult;
  model: MatrixModel;
  participantNameById: Record<string, string>;
}

type ViewMode = "list" | "grid";

export function MatchingView({ matching, model, participantNameById }: Props) {
  const [view, setView] = useState<ViewMode>("list");

  if (matching.totalParticipants === 0) {
    return (
      <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground bg-background">
        응답이 모이면 자동 배정 조합이 표시됩니다
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary + view toggle */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="rounded-lg border bg-muted/20 p-4 text-sm flex-1 min-w-0">
          <div className="font-semibold">
            최대 {matching.maxSize} / {matching.totalParticipants}명 배정 가능
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            가능한 조합 {matching.matchings.length}개{matching.truncated ? "+" : ""} 표시
            {matching.truncated && " (상위 20개)"}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <ViewToggleButton active={view === "list"} onClick={() => setView("list")}>
            📋 목록
          </ViewToggleButton>
          <ViewToggleButton active={view === "grid"} onClick={() => setView("grid")}>
            🗓 그리드
          </ViewToggleButton>
        </div>
      </div>

      {view === "list" ? (
        <ListView matching={matching} model={model} participantNameById={participantNameById} />
      ) : (
        <GridView matching={matching} model={model} participantNameById={participantNameById} />
      )}
    </div>
  );
}

/* ─── List view (original card layout) ─── */

function ListView({ matching, model, participantNameById }: Props) {
  const slotLabelById = Object.fromEntries(
    model.slotColumns.map((c) => [c.slotId, `${c.dateLabel} ${c.timeLabel}`])
  );

  return (
    <div className="flex flex-col gap-4">
      {matching.matchings.map((m, idx) => {
        const stableKey = Object.entries(m.assignments)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([p, s]) => `${p}:${s}`)
          .join("|") || `empty-${idx}`;
        return (
          <div key={stableKey} className="rounded-xl border bg-background p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              조합 #{idx + 1}
            </div>
            <div className="flex flex-col gap-1.5 text-sm">
              {Object.entries(m.assignments).map(([pid, slotId]) => (
                <div key={pid} className="flex items-center justify-between">
                  <span>{participantNameById[pid] ?? pid}</span>
                  <span className="text-accent font-medium tabular-nums">
                    {slotLabelById[slotId] ?? slotId}
                  </span>
                </div>
              ))}
              {m.unmatched.length > 0 && (
                <div className="pt-2 mt-2 border-t text-[11px] text-muted-foreground">
                  미배정: {m.unmatched.map((id) => participantNameById[id] ?? id).join(", ")}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Grid view (date columns × time rows, one grid per combination) ─── */

function GridView({ matching, model, participantNameById }: Props) {
  const { dateGroups, timeGroups, groupedCells } = model;
  const [selectedIdx, setSelectedIdx] = useState(0);

  const m = matching.matchings[selectedIdx];
  if (!m) return null;

  // slotId → assigned participant name for this combination
  const slotToName: Record<string, string> = {};
  for (const [pid, slotId] of Object.entries(m.assignments)) {
    slotToName[slotId] = participantNameById[pid] ?? pid;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Combination selector */}
      <div className="flex gap-1.5 flex-wrap">
        {matching.matchings.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md border transition-colors",
              idx === selectedIdx
                ? "bg-foreground text-background border-foreground font-semibold"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            )}
          >
            #{idx + 1}
          </button>
        ))}
      </div>

      {/* Grid table */}
      <div className="rounded-xl border bg-background overflow-x-auto">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="sticky left-0 bg-muted/30 text-left font-semibold px-3 py-2 z-10 min-w-[56px]">
                시간
              </th>
              {dateGroups.map((d) => (
                <th
                  key={d.dateYmd}
                  className="px-3 py-2 font-semibold text-center min-w-[110px] border-l border-border/40"
                >
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
                    return (
                      <td key={d.dateYmd} className="px-2 py-2 border-l border-border/40 bg-muted/10" />
                    );
                  }
                  const assignedName = slotToName[cell.slotId];
                  return (
                    <td
                      key={d.dateYmd}
                      className={cn(
                        "px-2 py-2 border-l border-border/40 text-center",
                        assignedName ? "bg-accent/20" : "bg-background"
                      )}
                    >
                      {assignedName ? (
                        <span className="inline-block text-[11px] font-semibold text-accent-foreground truncate max-w-[90px]">
                          {assignedName}
                        </span>
                      ) : (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/25 align-middle" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Unmatched note */}
      {m.unmatched.length > 0 && (
        <p className="text-[11px] text-muted-foreground px-1">
          미배정: {m.unmatched.map((id) => participantNameById[id] ?? id).join(", ")}
        </p>
      )}
    </div>
  );
}

/* ─── Shared helper ─── */

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
