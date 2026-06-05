import { useState, useEffect } from "react";
import { List, CalendarDays } from "lucide-react";
import type { MatchingResult, Slot } from "@meetplan/shared";
import type { MatrixModel } from "./matrixModel";
import { CalendarSyncPanel } from "./CalendarSyncPanel";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface Props {
  matching: MatchingResult;
  model: MatrixModel;
  participantNameById: Record<string, string>;
  participantColors: Record<string, string>;
  hiddenIds: Set<string>;
  onToggleHidden: (id: string) => void;
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
      <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground bg-background">
        {t("matching.noResponses")}
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

      {matching.totalParticipants === 0 && (
        <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground bg-background">
          {hiddenCount > 0
            ? t("matching.hiddenEmpty", { count: hiddenCount })
            : t("matching.noResponses")}
        </div>
      )}

      {matching.totalParticipants > 0 && (
        <>
          {/* Summary + controls row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="rounded-lg border bg-muted/20 p-4 text-sm flex-1 min-w-0">
              <div className="font-semibold">
                {t("matching.summary", { max: matching.maxSize, total: matching.totalParticipants })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t("matching.combinations", { count: matching.matchings.length })}
                {matching.truncated && <span> {t("matching.combinationsTruncated")}</span>}
                {hiddenCount > 0 && (
                  <span className="ml-2 text-amber-600">
                    · {t("matching.hiddenNote", { count: hiddenCount })}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground/70 mt-2 border-t border-border/40 pt-2">
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
              "rounded-xl border bg-background p-4 cursor-pointer transition-colors",
              isSelected
                ? "border-primary/60 ring-1 ring-primary/30"
                : "hover:border-border/80"
            )}
            onClick={() => onSelectIdx(idx)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("matching.comboLabel", { num: idx + 1 })}
              </div>
              {/* Radio indicator */}
              <div
                className={cn(
                  "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40"
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
                    <span className="text-accent font-medium tabular-nums whitespace-nowrap">
                      {slotLabelById[slotId] ?? slotId}
                    </span>
                  </div>
                );
              })}
              {m.unmatched.length > 0 && (
                <div className="pt-2 mt-2 border-t text-[11px] text-muted-foreground">
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
                ? "bg-foreground text-background border-foreground font-semibold"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            )}
          >
            #{idx + 1}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-background overflow-x-auto">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="sticky left-0 bg-muted/30 text-left font-semibold px-3 py-2 z-10 min-w-[56px]">
                {t("matching.colTime")}
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
            {timeGroups.map((tm) => (
              <tr key={tm.hhmm} className="border-b last:border-0">
                <td className="sticky left-0 bg-background px-3 py-2 font-medium text-muted-foreground border-r border-border/40">
                  {tm.hhmm}
                </td>
                {dateGroups.map((d) => {
                  const cell = groupedCells[`${d.dateYmd}_${tm.hhmm}`];
                  if (!cell) {
                    return <td key={d.dateYmd} className="px-2 py-2 border-l border-border/40 bg-muted/10" />;
                  }
                  const assignedPid = slotToPid[cell.slotId];
                  const assignedName = assignedPid
                    ? (participantNameById[assignedPid] ?? assignedPid)
                    : undefined;
                  const assignedColor = assignedPid ? participantColors[assignedPid] : undefined;
                  return (
                    <td
                      key={d.dateYmd}
                      className="px-2 py-2 border-l border-border/40 text-center"
                      style={assignedColor ? { backgroundColor: assignedColor + "22" } : undefined}
                    >
                      {assignedName ? (
                        <span
                          className="inline-block text-[11px] font-semibold truncate max-w-[90px]"
                          style={{ color: assignedColor }}
                        >
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

      {m.unmatched.length > 0 && (
        <p className="text-[11px] text-muted-foreground px-1">
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
          ? "bg-foreground text-background border-foreground font-semibold"
          : "bg-background text-muted-foreground border-border hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
