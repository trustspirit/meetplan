import { Fragment, useRef, type PointerEvent } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnce } from "@/lib/useOnce";
import { ScrollArea } from "@/components/ui/scroll-area";
import { t } from "@/lib/i18n";
import type { CellGridModel } from "./slotsToCells";

interface Props {
  grid: CellGridModel;
  selectedSlotIds: Set<string>;
  onSetSlot: (slotId: string, on: boolean) => void;
  viewerTz: string;
}

export function ParticipantGrid({ grid, selectedSlotIds, onSetSlot, viewerTz }: Props) {
  // painting.current === null: not dragging
  // visited: slotIds already set in this drag (prevents redundant setState)
  const painting = useRef<{ targetState: boolean; visited: Set<string> } | null>(null);
  const { shouldShow: showHint, dismiss: dismissHint } = useOnce("respond-paint-hint");

  const applyToSlot = (slotId: string) => {
    const p = painting.current;
    if (!p || p.visited.has(slotId)) return;
    p.visited.add(slotId);
    onSetSlot(slotId, p.targetState);
  };

  const handleDown = (slotId: string, on: boolean) => {
    painting.current = { targetState: !on, visited: new Set([slotId]) };
    onSetSlot(slotId, !on);
    if (showHint) dismissHint();
  };

  // Unified drag tracker — works for mouse and touch.
  // elementFromPoint sidesteps touch's implicit pointer capture on the start cell.
  const handleRootPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!painting.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cell = el?.closest<HTMLElement>("[data-slot-id]");
    if (!cell) return;
    const slotId = cell.dataset.slotId;
    if (slotId) applyToSlot(slotId);
  };

  const handleUp = () => { painting.current = null; };

  return (
    <div
      className="rounded-lg border border-border bg-surface"
      onPointerMove={handleRootPointerMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerLeave={handleUp}
    >
      {showHint && (
        <div className="m-4 mb-0 flex items-start gap-2 rounded-md border border-primary/30 bg-primary-subtle p-2.5 text-2xs text-primary">
          <Info size={13} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <b>{t('grid.paintHintLabel')}</b> {t('grid.paintHint')}
          </div>
          <button
            type="button"
            onClick={dismissHint}
            className="px-1 text-primary/70 hover:text-primary"
            aria-label={t('grid.paintHintClose')}
          >
            <X size={12} />
          </button>
        </div>
      )}

      <ScrollArea contentClassName="p-4">
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `40px repeat(${grid.dates.length}, minmax(56px, 1fr))`,
            minWidth: `${40 + grid.dates.length * 56}px`,
          }}
        >
          <div className="sticky left-0 z-10 bg-surface" />
          {grid.dates.map((ymd) => {
            const anchor = new Date(`${ymd}T12:00:00Z`);
            const weekday = formatInTimeZone(anchor, viewerTz, "EEE");
            const mdLabel = formatInTimeZone(anchor, viewerTz, "M/d");
            return (
              <div key={ymd} className="py-1 text-center text-2xs font-semibold text-text">
                <span className="mb-0.5 block text-2xs uppercase text-text-muted">{weekday}</span>
                {mdLabel}
              </div>
            );
          })}

          {grid.times.map((hhmm) => (
            <Fragment key={hhmm}>
              <div className="sticky left-0 z-10 bg-surface pr-1 text-right text-2xs leading-7 tabular-nums text-text-muted">
                {hhmm}
              </div>
              {grid.dates.map((ymd) => {
                const cellKey = `${ymd}_${hhmm}`;
                const available = grid.availableCells.has(cellKey);
                const slotId = grid.slotIdByCell.get(cellKey);
                const selected = !!(slotId && selectedSlotIds.has(slotId));
                return (
                  <div
                    key={cellKey}
                    role="gridcell"
                    // data-cell-key: SelectionSummary가 이 셀로 스크롤할 때 쓴다
                    data-cell-key={cellKey}
                    // data-slot-id enables elementFromPoint lookup during drag
                    {...(available && slotId ? { "data-slot-id": slotId } : {})}
                    aria-label={`${ymd} ${hhmm}`}
                    aria-selected={selected}
                    aria-disabled={!available}
                    onPointerDown={available && slotId ? () => handleDown(slotId, selected) : undefined}
                    className={cn(
                      "h-7 select-none rounded-sm transition-colors",
                      !available && "cursor-not-allowed bg-surface-subtle/50",
                      available && !selected && "cursor-pointer touch-none bg-surface-subtle hover:bg-brand-100",
                      available && selected && "cursor-pointer touch-none bg-primary"
                    )}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </ScrollArea>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-4 text-2xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 shrink-0 rounded-sm bg-primary/70" />
          {t('grid.usageHint')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 shrink-0 rounded-sm bg-surface-subtle/50" />
          {t('grid.dimmedCellHint')}
        </span>
      </div>
    </div>
  );
}
