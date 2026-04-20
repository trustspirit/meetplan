import { useRef, type PointerEvent } from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { cellKey } from "./useEventCreateState";
import { buildTimeAxis } from "./timeAxis";

interface Props {
  selectedDates: string[];
  dailyRange: [string, string];
  periodMinutes: number;
  paintedCells: Set<string>;
  onSetCell: (key: string, on: boolean) => void;
  onChangeRange: (range: [string, string]) => void;
}

export function TimePainter({
  selectedDates,
  dailyRange,
  periodMinutes,
  paintedCells,
  onSetCell,
  onChangeRange,
}: Props) {
  const axis = buildTimeAxis(dailyRange[0], dailyRange[1], periodMinutes);
  const painting = useRef<{ targetState: boolean } | null>(null);

  if (selectedDates.length === 0) {
    return (
      <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground bg-background">
        왼쪽 캘린더에서 날짜를 먼저 선택하세요
      </div>
    );
  }

  const handlePointerDown = (key: string, currentlyOn: boolean, e: PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    painting.current = { targetState: !currentlyOn };
    onSetCell(key, !currentlyOn);
  };
  const handlePointerEnter = (key: string) => {
    if (painting.current) onSetCell(key, painting.current.targetState);
  };
  const handlePointerUp = () => {
    painting.current = null;
  };

  return (
    <div className="rounded-xl border p-4 bg-background" onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">가용 시간 페인팅</div>
        <div className="flex items-center gap-2 text-xs">
          <input
            type="time"
            value={dailyRange[0]}
            onChange={(e) => onChangeRange([e.target.value, dailyRange[1]])}
            className="border rounded px-2 py-1 w-24"
          />
          <span>–</span>
          <input
            type="time"
            value={dailyRange[1]}
            onChange={(e) => onChangeRange([dailyRange[0], e.target.value])}
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
          <div />
          {selectedDates.map((ymd) => (
            <div key={ymd} className="text-center text-[11px] font-semibold text-foreground py-1">
              <span className="block text-[9px] text-muted-foreground uppercase mb-0.5">
                {format(parseISO(ymd), "EEE")}
              </span>
              {format(parseISO(ymd), "M/d")}
            </div>
          ))}

          {axis.map((hhmm) => (
            <TimeRow
              key={hhmm}
              hhmm={hhmm}
              dates={selectedDates}
              paintedCells={paintedCells}
              onPointerDown={handlePointerDown}
              onPointerEnter={handlePointerEnter}
            />
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mt-3">
        💡 클릭하거나 드래그해서 가능한 시간을 칠하세요.
      </p>
    </div>
  );
}

function TimeRow({
  hhmm,
  dates,
  paintedCells,
  onPointerDown,
  onPointerEnter,
}: {
  hhmm: string;
  dates: string[];
  paintedCells: Set<string>;
  onPointerDown: (key: string, on: boolean, e: PointerEvent) => void;
  onPointerEnter: (key: string) => void;
}) {
  return (
    <>
      <div className="text-right pr-1 text-[10px] text-muted-foreground leading-[22px] tabular-nums">{hhmm}</div>
      {dates.map((ymd) => {
        const key = cellKey(ymd, hhmm);
        const on = paintedCells.has(key);
        return (
          <div
            key={key}
            role="gridcell"
            aria-label={`${ymd} ${hhmm}`}
            aria-selected={on}
            onPointerDown={(e) => onPointerDown(key, on, e)}
            onPointerEnter={() => onPointerEnter(key)}
            className={cn(
              "h-[22px] rounded-sm cursor-pointer select-none transition-colors",
              on ? "bg-accent" : "bg-muted hover:bg-muted-foreground/20"
            )}
          />
        );
      })}
    </>
  );
}
