import { Fragment, useRef, type PointerEvent } from "react";
import { format, parseISO } from "date-fns";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { cellKey } from "./useEventCreateState";
import { useOnce } from "@/lib/useOnce";
import { buildTimeAxis, toMin } from "./timeAxis";
import { t } from "@/lib/i18n";

interface Props {
  selectedDates: string[];
  dailyRange: [string, string];
  periodMinutes: number;
  paintedCells: Set<string>;
  onSetCell: (key: string, on: boolean) => void;
  onChangeRange: (range: [string, string]) => void;
  busyCells?: Set<string>;
}

export function TimePainter({
  selectedDates,
  dailyRange,
  periodMinutes,
  paintedCells,
  onSetCell,
  onChangeRange,
  busyCells,
}: Props) {
  const axis = buildTimeAxis(dailyRange[0], dailyRange[1], periodMinutes);
  const { shouldShow: showHint, dismiss: dismissHint } = useOnce("create-paint-hint");
  const painting = useRef<{ targetState: boolean; visited: Set<string> } | null>(null);

  const applyToCell = (key: string) => {
    const p = painting.current;
    if (!p || p.visited.has(key)) return;
    p.visited.add(key);
    onSetCell(key, p.targetState);
  };

  const handlePointerDown = (key: string, currentlyOn: boolean) => {
    painting.current = { targetState: !currentlyOn, visited: new Set([key]) };
    onSetCell(key, !currentlyOn);
    if (showHint) dismissHint();
  };

  const handleRootPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!painting.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cell = el?.closest<HTMLElement>("[data-paint-key]");
    if (!cell) return;
    const key = cell.dataset.paintKey;
    if (key) applyToCell(key);
  };

  const handlePointerUp = () => {
    painting.current = null;
  };

  if (selectedDates.length === 0) {
    return (
      <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground bg-background">
        {t('painter.selectDatesFirst')}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-4 bg-background"
      onPointerMove={handleRootPointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {showHint && (
        <div className="mb-3 flex items-start gap-2 rounded-md bg-accent/10 border border-accent/30 p-2.5 text-[11px] text-accent">
          <Info size={13} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <b>{t('painter.hintLabel')}</b> {t('painter.hint')}
          </div>
          <button
            type="button"
            onClick={dismissHint}
            className="text-accent/70 hover:text-accent px-1"
            aria-label={t('painter.hintClose')}
          >
            <X size={12} />
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">{t('painter.title')}</div>
        <div className="flex items-center gap-2 text-xs">
          <input
            type="time"
            value={dailyRange[0]}
            onChange={(e) => {
              const newStart = e.target.value;
              onChangeRange([newStart, dailyRange[1] > newStart ? dailyRange[1] : newStart]);
            }}
            className="border rounded px-2 py-1 w-24"
          />
          <span>–</span>
          <input
            type="time"
            value={dailyRange[1]}
            onChange={(e) => {
              const newEnd = e.target.value;
              const newEndMin = newEnd === "00:00" ? 1440 : toMin(newEnd);
              if (newEndMin > toMin(dailyRange[0])) onChangeRange([dailyRange[0], newEnd]);
            }}
            className="border rounded px-2 py-1 w-24"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `40px repeat(${selectedDates.length}, minmax(56px, 1fr))`,
            minWidth: `${40 + selectedDates.length * 56}px`,
          }}
        >
          <div className="sticky left-0 z-10 bg-background" />
          {selectedDates.map((ymd) => (
            <div key={ymd} className="text-center text-[11px] font-semibold text-foreground py-1">
              <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">
                {format(parseISO(ymd), "EEE")}
              </span>
              {format(parseISO(ymd), "M/d")}
            </div>
          ))}

          {axis.map((hhmm) => (
            <Fragment key={hhmm}>
              <div className="sticky left-0 z-10 bg-background text-right pr-1 text-[10px] text-muted-foreground leading-[22px] tabular-nums">
                {hhmm}
              </div>
              {selectedDates.map((ymd) => {
                const key = cellKey(ymd, hhmm);
                const on = paintedCells.has(key);
                const isBusy = busyCells?.has(key) ?? false;
                return (
                  <div
                    key={key}
                    role="gridcell"
                    data-paint-key={key}
                    aria-label={`${ymd} ${hhmm}`}
                    aria-selected={on}
                    onPointerDown={() => handlePointerDown(key, on)}
                    className={cn(
                      "h-[22px] rounded-sm cursor-pointer select-none transition-colors touch-none",
                      on && !isBusy && "bg-accent",
                      on && isBusy && "bg-accent cell-busy",
                      !on && !isBusy && "bg-muted hover:bg-muted-foreground/20",
                      !on && isBusy && "bg-muted cell-busy hover:bg-muted-foreground/10",
                    )}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
      {busyCells && busyCells.size > 0 && (
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
          <span className="inline-block w-3 h-3 rounded-sm bg-muted cell-busy shrink-0" />
          {t('painter.busyCellHint')}
        </div>
      )}
    </div>
  );
}
