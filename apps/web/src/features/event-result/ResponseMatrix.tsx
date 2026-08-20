import { useState, Fragment } from "react";
import { BarChart2, User } from "lucide-react";
import type { MatrixModel } from "./matrixModel";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { heatLevel } from "./heatLevel";
import { ParticipantFilterBar } from "./ParticipantFilterBar";
import { ScrollArea } from "@/components/ui/scroll-area";

type ViewMode = "heatmap" | "participant";

interface Props {
  model: MatrixModel;
  totalResponses: number;
  participantColors: Record<string, string>;
  hiddenIds: Set<string>;
  onToggleHidden: (id: string) => void;
  onToggleAll: (show: boolean) => void;
}

export function ResponseMatrix({ model, totalResponses, participantColors, hiddenIds, onToggleHidden, onToggleAll }: Props) {
  const [view, setView] = useState<ViewMode>("heatmap");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (model.rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-text-muted">
        {t('matrix.noResponses')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ParticipantFilterBar
        rows={model.rows}
        participantColors={participantColors}
        hiddenIds={hiddenIds}
        onToggleHidden={onToggleHidden}
        onToggleAll={onToggleAll}
        hoveredId={hoveredId}
        onHover={setHoveredId}
      />

      <div className="flex gap-1 self-end">
        <ViewToggleButton active={view === "heatmap"} onClick={() => setView("heatmap")}>
          <BarChart2 size={12} className="mr-1" />{t('matrix.viewHeatmap')}
        </ViewToggleButton>
        <ViewToggleButton active={view === "participant"} onClick={() => setView("participant")}>
          <User size={12} className="mr-1" />{t('matrix.viewParticipant')}
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
    <>
    <ScrollArea className="rounded-lg border border-border bg-surface">
      <table className="min-w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface-subtle">
            <th className="sticky left-0 bg-surface-subtle text-left font-semibold px-3 py-2 z-10 min-w-[56px]">
              {t('matrix.colTime')}
            </th>
            {dateGroups.map((d) => (
              <th key={d.dateYmd} className="px-3 py-2 font-semibold text-center min-w-[120px] border-l border-border">
                {d.dateLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeGroups.map((t) => (
            <tr key={t.hhmm} className="border-b last:border-0">
              <td className="sticky left-0 bg-surface px-3 py-2 font-medium text-text-muted border-r border-border">
                {t.hhmm}
              </td>
              {dateGroups.map((d) => {
                const cell = groupedCells[`${d.dateYmd}_${t.hhmm}`];
                if (!cell) {
                  return <td key={d.dateYmd} className="px-2 py-3 border-l border-border bg-surface-subtle/50" />;
                }

                const displayed = cell.participants.filter((p) => {
                  if (hoveredId) return hoveredId === p.responseId;
                  return !hiddenIds.has(p.responseId);
                });
                const visibleCount = cell.participants.filter((p) => !hiddenIds.has(p.responseId)).length;
                const ratio = visibleTotal > 0 ? visibleCount / visibleTotal : 0;

                const heat = heatLevel(ratio);
                return (
                  <td
                    key={d.dateYmd}
                    className={cn(
                      "border-l border-border px-2 py-3 align-top transition-colors",
                      hoveredId
                        ? displayed.length > 0 ? "bg-surface" : "bg-surface-subtle"
                        : heat.bg
                    )}
                  >
                    <span className={cn(
                      "mb-0.5 block text-2xs font-semibold",
                      hoveredId ? "text-text-muted" : heat.fg
                    )}>
                      {visibleCount}/{visibleTotal}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {displayed.map((p) => {
                        const color = participantColors[p.responseId] ?? "#888";
                        return (
                          <span
                            key={p.responseId}
                            className="block max-w-[108px] truncate rounded bg-surface px-1 text-2xs font-medium leading-tight"
                            style={{ color, borderLeft: `2px solid ${color}` }}
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
    </ScrollArea>
    <div className="mt-2 flex items-center gap-2 px-1 text-2xs text-text-muted">
      <span className="shrink-0">{t('matrix.availabilityLegend')}</span>
      <span className="inline-block h-4 w-4 rounded-sm border border-border bg-surface" />
      <span className="inline-block h-4 w-4 rounded-sm bg-brand-50" />
      <span className="inline-block h-4 w-4 rounded-sm bg-brand-100" />
      <span className="inline-block h-4 w-4 rounded-sm bg-brand-300" />
      <span className="inline-block h-4 w-4 rounded-sm bg-brand-500" />
      <span className="inline-block h-4 w-4 rounded-sm bg-brand-600" />
      <span className="shrink-0">0% → 100%</span>
    </div>
    </>
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
    <ScrollArea className="rounded-lg border border-border bg-surface">
      <table className="min-w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface-subtle">
            <th className="sticky left-0 bg-surface-subtle text-left font-semibold px-3 py-2 z-10 min-w-[80px]">
              {t('matrix.colDatetime')}
            </th>
            {visibleRows.map((r) => {
              const color = participantColors[r.responseId] ?? "#888";
              const hovered = hoveredId === r.responseId;
              return (
                <th
                  key={r.responseId}
                  className="px-3 py-2 font-semibold text-center min-w-[72px] border-l border-border"
                  style={{ opacity: hoveredId && !hovered ? 0.3 : 1 }}
                >
                  <span
                    className="block truncate max-w-[64px] mx-auto text-2xs"
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
            <Fragment key={d.dateYmd}>
              <tr className="bg-surface-subtle border-b border-t">
                <td className="sticky left-0 z-10 bg-surface-subtle px-3 py-1 font-semibold text-2xs text-text-muted uppercase tracking-wide">
                  {d.dateLabel}
                </td>
                {visibleRows.map((r) => (
                  <td key={r.responseId} className="bg-surface-subtle border-l border-border" />
                ))}
              </tr>
              {timeGroups.map((tm) => {
                const cell = groupedCells[`${d.dateYmd}_${tm.hhmm}`];
                if (!cell) return null;
                return (
                  <tr key={`${d.dateYmd}_${tm.hhmm}`} className="border-b last:border-0">
                    <td className="sticky left-0 bg-surface px-3 py-2 text-text-muted border-r border-border">
                      {tm.hhmm}
                    </td>
                    {visibleRows.map((r) => {
                      const available = r.checks[cell.slotId] ?? false;
                      const color = participantColors[r.responseId] ?? "#888";
                      const hovered = hoveredId === r.responseId;
                      const dimmed = hoveredId && !hovered;
                      return (
                        <td
                          key={r.responseId}
                          className="px-2 py-3 text-center border-l border-border transition-opacity"
                          style={{ opacity: dimmed ? 0.2 : 1 }}
                        >
                          {available ? (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-sm"
                              style={{ backgroundColor: color + "33", color }}
                              aria-label={t('matrix.available')}
                            >
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-border-strong align-middle" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </Fragment>
          ))}
          <tr className="bg-surface-subtle/60 border-t font-semibold">
            <td className="sticky left-0 bg-surface-subtle/60 px-3 py-2 text-2xs text-text-muted border-r border-border">
              {t('matrix.rowAvailSlots')}
            </td>
            {visibleRows.map((r) => {
              const count = Object.values(r.checks).filter(Boolean).length;
              const color = participantColors[r.responseId] ?? "#888";
              return (
                <td key={r.responseId} className="px-2 py-3 text-center text-2xs border-l border-border" style={{ color }}>
                  {count}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </ScrollArea>
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
        "flex min-h-touch items-center rounded-md border px-3 text-xs transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary font-semibold text-primary-foreground"
          : "border-border bg-surface text-text-muted hover:text-text"
      )}
    >
      {children}
    </button>
  );
}
