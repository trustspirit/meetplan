import { Fragment, useEffect, useRef, useState, type PointerEvent } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnce } from "@/lib/useOnce";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const COLUMN_WIDTH = 56;
  const { shouldShow: showHint, dismiss: dismissHint } = useOnce("respond-paint-hint");
  const [hasMoreRight, setHasMoreRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const { scrollLeft, clientWidth, scrollWidth } = el;
      setHasMoreRight(scrollLeft + clientWidth < scrollWidth - 2);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

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
    <div className="rounded-xl border bg-background relative">
      {hasMoreRight && (
        <div className="absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-l from-background to-transparent pointer-events-none z-20 rounded-r-xl" />
      )}
      <div
        ref={scrollRef}
        className="overflow-x-auto p-4"
        onPointerMove={handleRootPointerMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onPointerLeave={handleUp}
      >
        {showHint && (
          <div className="mb-3 flex items-start gap-2 rounded-md bg-accent/10 border border-accent/30 p-2.5 text-[11px] text-accent">
            <Info size={13} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <b>{t('grid.paintHintLabel')}</b> {t('grid.paintHint')}
            </div>
            <button
              type="button"
              onClick={dismissHint}
              className="text-accent/70 hover:text-accent px-1"
              aria-label={t('grid.paintHintClose')}
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `40px repeat(${grid.dates.length}, minmax(56px, 1fr))`,
            minWidth: `${40 + grid.dates.length * 56}px`,
          }}
        >
          <div className="sticky left-0 z-10 bg-background" />
          {grid.dates.map((ymd) => {
            const anchor = new Date(`${ymd}T12:00:00Z`);
            const weekday = formatInTimeZone(anchor, viewerTz, "EEE");
            const mdLabel = formatInTimeZone(anchor, viewerTz, "M/d");
            return (
              <div key={ymd} className="text-center text-[11px] font-semibold text-foreground py-1">
                <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">{weekday}</span>
                {mdLabel}
              </div>
            );
          })}

          {grid.times.map((hhmm) => (
            <Fragment key={hhmm}>
              <div className="sticky left-0 z-10 bg-background text-right pr-1 text-[10px] text-muted-foreground leading-[22px] tabular-nums">{hhmm}</div>
              {grid.dates.map((ymd) => {
                const cellKey = `${ymd}_${hhmm}`;
                const available = grid.availableCells.has(cellKey);
                const slotId = grid.slotIdByCell.get(cellKey);
                const selected = !!(slotId && selectedSlotIds.has(slotId));
                return (
                  <div
                    key={cellKey}
                    role="gridcell"
                    // data-slot-id enables elementFromPoint lookup during drag
                    {...(available && slotId ? { "data-slot-id": slotId } : {})}
                    aria-label={`${ymd} ${hhmm}`}
                    aria-selected={selected}
                    aria-disabled={!available}
                    onPointerDown={available && slotId ? () => handleDown(slotId, selected) : undefined}
                    className={cn(
                      "h-[22px] rounded-sm select-none transition-colors",
                      !available && "bg-muted/30 cursor-not-allowed",
                      available && !selected && "bg-muted hover:bg-muted-foreground/20 cursor-pointer touch-none",
                      available && selected && "bg-accent cursor-pointer touch-none"
                    )}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-accent/70 shrink-0" />
            {t('grid.usageHint')}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-muted/30 shrink-0" />
            {t('grid.dimmedCellHint')}
          </span>
        </div>
      </div>
      <ScrollIndicator containerRef={scrollRef} columnWidth={COLUMN_WIDTH} total={grid.dates.length} />
    </div>
  );
}
