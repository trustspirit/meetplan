import { useState, useEffect } from "react";
import { List, CalendarDays } from "lucide-react";
import type { MatchingResult, Slot } from "@meetplan/shared";
import type { MatrixModel } from "./matrixModel";
import { CalendarSyncPanel } from "./CalendarSyncPanel";
import { ParticipantFilterBar } from "./ParticipantFilterBar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface Props {
  matching: MatchingResult;
  model: MatrixModel;
  participantNameById: Record<string, string>;
  participantColors: Record<string, string>;
  hiddenIds: Set<string>;
  onToggleHidden: (id: string) => void;
  onToggleAll: (show: boolean) => void;
  slots: Slot[];
  eventTitle: string;
  eventDescription?: string | undefined;
}

type ViewMode = "list" | "grid";

export function MatchingView({
  matching,
  model,
  participantNameById,
  participantColors,
  hiddenIds,
  onToggleHidden,
  onToggleAll,
  slots,
  eventTitle,
  eventDescription,
}: Props) {
  const [view, setView] = useState<ViewMode>("list");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    if (selectedIdx >= matching.matchings.length) setSelectedIdx(0);
  }, [matching.matchings.length, selectedIdx]);

  const hiddenCount = hiddenIds.size;

  if (model.rows.length === 0) {
    return (
      <div className="rounded-lg border border-border p-10 text-center text-sm text-text-muted bg-surface">
        {t("matching.noResponses")}
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

      {matching.totalParticipants === 0 && (
        <div className="rounded-lg border border-border p-10 text-center text-sm text-text-muted bg-surface">
          {hiddenCount > 0
            ? t("matching.hiddenEmpty", { count: hiddenCount })
            : t("matching.noResponses")}
        </div>
      )}

      {matching.totalParticipants > 0 && (
        <>
          {/* Summary + controls row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="rounded-lg border bg-surface-subtle/60 p-4 text-sm flex-1 min-w-0">
              <div className="font-semibold">
                {t("matching.summary", { max: matching.maxSize, total: matching.totalParticipants })}
              </div>
              <div className="text-xs text-text-muted mt-1">
                {t("matching.combinations", { count: matching.matchings.length })}
                {matching.truncated && <span> {t("matching.combinationsTruncated")}</span>}
                {hiddenCount > 0 && (
                  <span className="ml-2 text-warning">
                    · {t("matching.hiddenNote", { count: hiddenCount })}
                  </span>
                )}
              </div>
              <div className="text-2xs text-text-subtle mt-2 border-t border-border pt-2">
                {t("matching.description")}
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0 items-end">
              {/* Calendar sync button — shown when a combo is selected */}
              {matching.matchings[selectedIdx] && (
                <CalendarSyncPanel
                  selectedMatching={matching.matchings[selectedIdx]!}
                  slots={slots}
                  eventTitle={eventTitle}
                  eventDescription={eventDescription}
                  participantNameById={participantNameById}
                />
              )}
              {/* View toggle */}
              <div className="flex gap-1">
                <ViewToggleButton active={view === "list"} onClick={() => setView("list")}>
                  <List size={12} className="mr-1" />{t("matching.viewList")}
                </ViewToggleButton>
                <ViewToggleButton active={view === "grid"} onClick={() => setView("grid")}>
                  <CalendarDays size={12} className="mr-1" />{t("matching.viewGrid")}
                </ViewToggleButton>
              </div>
            </div>
          </div>

          {view === "list" ? (
            <ListView
              matching={matching}
              model={model}
              participantNameById={participantNameById}
              participantColors={participantColors}
              selectedIdx={selectedIdx}
              onSelectIdx={setSelectedIdx}
            />
          ) : (
            <GridView
              matching={matching}
              model={model}
              participantNameById={participantNameById}
              participantColors={participantColors}
              selectedIdx={selectedIdx}
              onSelectIdx={setSelectedIdx}
            />
          )}
        </>
      )}
    </div>
  );
}

type SubViewProps = Pick<Props, "matching" | "model" | "participantNameById" | "participantColors"> & {
  selectedIdx: number;
  onSelectIdx: (i: number) => void;
};

/* ─── List view ─── */

function ListView({ matching, model, participantNameById, participantColors, selectedIdx, onSelectIdx }: SubViewProps) {
  const slotLabelById = Object.fromEntries(
    model.slotColumns.map((c) => [c.slotId, `${c.dateLabel} ${c.timeLabel}`])
  );

  return (
    <div className="flex flex-col gap-3">
      {matching.matchings.map((m, idx) => {
        const stableKey =
          Object.entries(m.assignments)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([p, s]) => `${p}:${s}`)
            .join("|") || `empty-${idx}`;
        const isSelected = idx === selectedIdx;
        return (
          <div
            key={stableKey}
            className={cn(
              "rounded-xl border bg-surface p-4 cursor-pointer transition-colors",
              isSelected
                ? "border-primary/60 ring-1 ring-primary/30"
                : "hover:border-border/80"
            )}
            onClick={() => onSelectIdx(idx)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-2xs font-semibold uppercase tracking-wide text-text-muted">
                {t("matching.comboLabel", { num: idx + 1 })}
              </div>
              {/* Radio indicator */}
              <div
                className={cn(
                  "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-border-strong"
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5 text-sm">
              {Object.entries(m.assignments).map(([pid, slotId]) => {
                const color = participantColors[pid];
                return (
                  <div key={pid} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      {color && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      )}
                      <span className="truncate">{participantNameById[pid] ?? pid}</span>
                    </span>
                    <span className="text-primary font-medium tabular-nums whitespace-nowrap">
                      {slotLabelById[slotId] ?? slotId}
                    </span>
                  </div>
                );
              })}
              {m.unmatched.length > 0 && (
                <div className="pt-2 mt-2 border-t text-2xs text-text-muted">
                  {t("matching.unmatched")}{" "}
                  {m.unmatched.map((id) => participantNameById[id] ?? id).join(", ")}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Grid view ─── */

function GridView({ matching, model, participantNameById, participantColors, selectedIdx, onSelectIdx }: SubViewProps) {
  const { dateGroups, timeGroups, groupedCells } = model;

  const m = matching.matchings[selectedIdx];
  if (!m) return null;

  const slotToPid: Record<string, string> = {};
  for (const [pid, slotId] of Object.entries(m.assignments)) {
    slotToPid[slotId] = pid;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5 flex-wrap">
        {matching.matchings.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectIdx(idx)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md border transition-colors",
              idx === selectedIdx
                ? "bg-primary text-primary-foreground border-primary font-semibold"
                : "bg-surface text-text-muted border-border hover:text-text"
            )}
          >
            #{idx + 1}
          </button>
        ))}
      </div>

      <ScrollArea className="rounded-lg border border-border bg-surface">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr className="border-b bg-surface-subtle">
              <th className="sticky left-0 bg-surface-subtle text-left font-semibold px-3 py-2 z-10 min-w-[56px]">
                {t("matching.colTime")}
              </th>
              {dateGroups.map((d) => (
                <th
                  key={d.dateYmd}
                  className="px-3 py-2 font-semibold text-center min-w-[110px] border-l border-border"
                >
                  {d.dateLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeGroups.map((tm) => (
              <tr key={tm.hhmm} className="border-b last:border-0">
                <td className="sticky left-0 bg-surface px-3 py-2 font-medium text-text-muted border-r border-border">
                  {tm.hhmm}
                </td>
                {dateGroups.map((d) => {
                  const cell = groupedCells[`${d.dateYmd}_${tm.hhmm}`];
                  if (!cell) {
                    return <td key={d.dateYmd} className="px-2 py-2 border-l border-border bg-surface-subtle/50" />;
                  }
                  const assignedPid = slotToPid[cell.slotId];
                  const assignedName = assignedPid
                    ? (participantNameById[assignedPid] ?? assignedPid)
                    : undefined;
                  const assignedColor = assignedPid ? participantColors[assignedPid] : undefined;
                  return (
                    <td
                      key={d.dateYmd}
                      className="px-2 py-2 border-l border-border text-center"
                      style={assignedColor ? { backgroundColor: assignedColor + "22" } : undefined}
                    >
                      {assignedName ? (
                        <span
                          className="inline-block text-2xs font-semibold truncate max-w-[90px]"
                          style={{ color: assignedColor }}
                        >
                          {assignedName}
                        </span>
                      ) : (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-border-strong align-middle" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>

      {m.unmatched.length > 0 && (
        <p className="text-2xs text-text-muted px-1">
          {t("matching.unmatched")}{" "}
          {m.unmatched.map((id) => participantNameById[id] ?? id).join(", ")}
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
        "px-3 py-1.5 text-xs rounded-md border transition-colors flex items-center",
        active
          ? "bg-primary text-primary-foreground border-primary font-semibold"
          : "bg-surface text-text-muted border-border hover:text-text"
      )}
    >
      {children}
    </button>
  );
}
