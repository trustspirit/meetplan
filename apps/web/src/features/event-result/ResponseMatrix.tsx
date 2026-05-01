import { useState } from "react";
import type { MatrixModel } from "./matrixModel";
import { cn } from "@/lib/utils";

type ViewMode = "heatmap" | "participant";

interface Props {
  model: MatrixModel;
  totalResponses: number;
  participantColors: Record<string, string>;
  hiddenIds: Set<string>;
  onToggleHidden: (id: string) => void;
}

export function ResponseMatrix({ model, totalResponses, participantColors, hiddenIds, onToggleHidden }: Props) {
  const [view, setView] = useState<ViewMode>("heatmap");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (model.rows.length === 0) {
    return (
      <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground bg-background">
        아직 응답이 없습니다
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Participant legend */}
      <div className="flex flex-wrap gap-2 rounded-xl border bg-muted/20 px-3 py-2.5">
        {model.rows.map((r) => {
          const color = participantColors[r.responseId] ?? "#888";
          const hidden = hiddenIds.has(r.responseId);
          const hovered = hoveredId === r.responseId;
          return (
            <label
              key={r.responseId}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer select-none border-2 transition-all",
                hidden ? "opacity-40" : "opacity-100"
              )}
              style={{
                borderColor: hovered ? color : "transparent",
                backgroundColor: hovered ? color + "22" : "transparent",
              }}
              onMouseEnter={() => setHoveredId(r.responseId)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <input
                type="checkbox"
                checked={!hidden}
                onChange={() => onToggleHidden(r.responseId)}
                className="w-3 h-3 cursor-pointer"
                style={{ accentColor: color }}
              />
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className={hidden ? "line-through" : ""}>{r.name}</span>
            </label>
          );
        })}
      </div>

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
        <HeatmapView
          model={model}
          totalResponses={totalResponses}
          participantColors={participantColors}
          hiddenIds={hiddenIds}
          hoveredId={hoveredId}
        />
      ) : (
        <ParticipantView
          model={model}
          participantColors={participantColors}
          hiddenIds={hiddenIds}
          hoveredId={hoveredId}
        />
      )}
    </div>
  );
}

/* ─── Heatmap view ─── */

interface HeatmapProps {
  model: MatrixModel;
  totalResponses: number;
  participantColors: Record<string, string>;
  hiddenIds: Set<string>;
  hoveredId: string | null;
}

function HeatmapView({ model, totalResponses, participantColors, hiddenIds, hoveredId }: HeatmapProps) {
  const { dateGroups, timeGroups, groupedCells } = model;
  const visibleTotal = totalResponses - hiddenIds.size;

  return (
    <div className="rounded-xl border bg-background overflow-x-auto">
      <table className="min-w-full text-xs border-collapse">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="sticky left-0 bg-muted/30 text-left font-semibold px-3 py-2 z-10 min-w-[56px]">
              시간
            </th>
            {dateGroups.map((d) => (
              <th key={d.dateYmd} className="px-3 py-2 font-semibold text-center min-w-[120px] border-l border-border/40">
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

                // Spotlight mode: show only hovered (even if hidden); normal mode: exclude hidden
                const displayed = cell.participants.filter((p) => {
                  if (hoveredId) return hoveredId === p.responseId;
                  return !hiddenIds.has(p.responseId);
                });
                const visibleCount = cell.participants.filter((p) => !hiddenIds.has(p.responseId)).length;
                const ratio = visibleTotal > 0 ? visibleCount / visibleTotal : 0;

                return (
                  <td
                    key={d.dateYmd}
                    className={cn(
                      "px-2 py-1.5 border-l border-border/40 align-top transition-colors",
                      hoveredId
                        ? displayed.length > 0 ? "bg-background" : "bg-muted/20"
                        : heatBg(ratio)
                    )}
                  >
                    <span className={cn(
                      "block font-semibold text-[11px] mb-0.5",
                      visibleCount > 0 ? "text-foreground/70" : "text-muted-foreground"
                    )}>
                      {visibleCount}/{visibleTotal}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {displayed.map((p) => {
                        const color = participantColors[p.responseId] ?? "#888";
                        return (
                          <span
                            key={p.responseId}
                            className="block text-[10px] leading-tight px-1 rounded font-medium truncate max-w-[108px] bg-background"
                            style={{
                              color,
                              borderLeft: `2px solid ${color}`,
                            }}
                          >
                            {p.name}
                          </span>
                        );
                      })}
                    </div>
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

/* ─── Participant view ─── */

interface ParticipantProps {
  model: MatrixModel;
  participantColors: Record<string, string>;
  hiddenIds: Set<string>;
  hoveredId: string | null;
}

function ParticipantView({ model, participantColors, hiddenIds, hoveredId }: ParticipantProps) {
  const { dateGroups, timeGroups, groupedCells, rows } = model;
  const visibleRows = rows.filter((r) => !hiddenIds.has(r.responseId));

  return (
    <div className="rounded-xl border bg-background overflow-x-auto">
      <table className="min-w-full text-xs border-collapse">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="sticky left-0 bg-muted/30 text-left font-semibold px-3 py-2 z-10 min-w-[80px]">
              날짜 / 시간
            </th>
            {visibleRows.map((r) => {
              const color = participantColors[r.responseId] ?? "#888";
              const hovered = hoveredId === r.responseId;
              return (
                <th
                  key={r.responseId}
                  className="px-3 py-2 font-semibold text-center min-w-[72px] border-l border-border/40"
                  style={{ opacity: hoveredId && !hovered ? 0.3 : 1 }}
                >
                  <span
                    className="block truncate max-w-[64px] mx-auto text-[11px]"
                    style={{ color }}
                  >
                    {r.name}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {dateGroups.map((d) => (
            <>
              <tr key={`header_${d.dateYmd}`} className="bg-muted/30 border-b border-t">
                <td className="sticky left-0 z-10 bg-muted/30 px-3 py-1 font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
                  {d.dateLabel}
                </td>
                {visibleRows.map((r) => (
                  <td key={r.responseId} className="bg-muted/30 border-l border-border/40" />
                ))}
              </tr>
              {timeGroups.map((t) => {
                const cell = groupedCells[`${d.dateYmd}_${t.hhmm}`];
                if (!cell) return null;
                return (
                  <tr key={`${d.dateYmd}_${t.hhmm}`} className="border-b last:border-0">
                    <td className="sticky left-0 bg-background px-3 py-2 text-muted-foreground border-r border-border/40">
                      {t.hhmm}
                    </td>
                    {visibleRows.map((r) => {
                      const available = r.checks[cell.slotId] ?? false;
                      const color = participantColors[r.responseId] ?? "#888";
                      const hovered = hoveredId === r.responseId;
                      const dimmed = hoveredId && !hovered;
                      return (
                        <td
                          key={r.responseId}
                          className="px-2 py-2 text-center border-l border-border/40 transition-opacity"
                          style={{ opacity: dimmed ? 0.2 : 1 }}
                        >
                          {available ? (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-sm"
                              style={{ backgroundColor: color + "33", color }}
                              aria-label="가능"
                            >
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/25 align-middle" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </>
          ))}
          <tr className="bg-muted/20 border-t font-semibold">
            <td className="sticky left-0 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground border-r border-border/40">
              가능 슬롯
            </td>
            {visibleRows.map((r) => {
              const count = Object.values(r.checks).filter(Boolean).length;
              const color = participantColors[r.responseId] ?? "#888";
              return (
                <td key={r.responseId} className="px-2 py-2 text-center text-[11px] border-l border-border/40" style={{ color }}>
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
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

function heatBg(ratio: number): string {
  if (ratio === 0) return "bg-muted/10";
  if (ratio <= 0.25) return "bg-muted/25";
  if (ratio <= 0.5) return "bg-muted/45";
  if (ratio <= 0.75) return "bg-muted/65";
  return "bg-muted/80";
}

