import { Fragment, useRef, type PointerEvent } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { cn } from "@/lib/utils";
import { useOnce } from "@/lib/useOnce";
import type { CellGridModel } from "./slotsToCells";

interface Props {
  grid: CellGridModel;
  selectedSlotIds: Set<string>;
  onSetSlot: (slotId: string, on: boolean) => void;
  viewerTz: string;
}

export function ParticipantGrid({ grid, selectedSlotIds, onSetSlot, viewerTz }: Props) {
  const painting = useRef<{ targetState: boolean } | null>(null);
  const { shouldShow: showHint, dismiss: dismissHint } = useOnce("respond-paint-hint");

  const handleDown = (slotId: string, on: boolean, e: PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    painting.current = { targetState: !on };
    onSetSlot(slotId, !on);
    if (showHint) dismissHint();
  };
  const handleEnter = (slotId: string) => {
    if (painting.current) onSetSlot(slotId, painting.current.targetState);
  };
  const handleUp = () => { painting.current = null; };

  return (
    <div className="rounded-xl border p-4 bg-background overflow-x-auto" onPointerUp={handleUp} onPointerCancel={handleUp}>
      {showHint && (
        <div className="mb-3 flex items-start gap-2 rounded-md bg-accent/10 border border-accent/30 p-2.5 text-[11px] text-accent">
          <span>💡</span>
          <div className="flex-1">
            <b>처음이신가요?</b> 셀을 <b>클릭</b>하거나 <b>드래그</b>해서 여러 시간을 한번에 선택하세요.
          </div>
          <button
            type="button"
            onClick={dismissHint}
            className="text-accent/70 hover:text-accent px-1"
            aria-label="닫기"
          >
            ✕
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
        <div />
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
            <div className="text-right pr-1 text-[10px] text-muted-foreground leading-[22px] tabular-nums">{hhmm}</div>
            {grid.dates.map((ymd) => {
              const cellKey = `${ymd}_${hhmm}`;
              const available = grid.availableCells.has(cellKey);
              const slotId = grid.slotIdByCell.get(cellKey);
              const selected = !!(slotId && selectedSlotIds.has(slotId));
              return (
                <div
                  key={cellKey}
                  role="gridcell"
                  aria-label={`${ymd} ${hhmm}`}
                  aria-selected={selected}
                  aria-disabled={!available}
                  onPointerDown={available && slotId ? (e) => handleDown(slotId, selected, e) : undefined}
                  onPointerEnter={available && slotId ? () => handleEnter(slotId) : undefined}
                  className={cn(
                    "h-[22px] rounded-sm select-none transition-colors",
                    !available && "bg-muted/30 cursor-not-allowed",
                    available && !selected && "bg-muted hover:bg-muted-foreground/20 cursor-pointer",
                    available && selected && "bg-accent cursor-pointer"
                  )}
                />
              );
            })}
          </Fragment>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground mt-3">
        흐린 셀은 호스트가 제공한 시간이 아닙니다.
      </p>
    </div>
  );
}
