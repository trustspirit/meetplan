import { Fragment, useState, useRef, type PointerEvent } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MultiDateCalendar } from "./MultiDateCalendar";
import { buildTimeAxis } from "./timeAxis";
import { cellKey } from "./useEventCreateState";

interface Props {
  title: string;
  onTitleChange: (v: string) => void;
  periodMinutes: number;
  onPeriodChange: (v: number) => void;
  selectedDates: string[];
  onToggleDate: (ymd: string) => void;
  dailyRange: [string, string];
  onChangeRange: (r: [string, string]) => void;
  paintedCells: Set<string>;
  onSetCell: (key: string, on: boolean) => void;
  onSubmit: () => void;
  submitting: boolean;
  canSubmit: boolean;
  slotCount: number;
}

export function MobileWizard(props: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  // painting.current === null: not dragging
  // visited: keys already set this drag (prevents redundant setState)
  const painting = useRef<{ targetState: boolean; visited: Set<string> } | null>(null);

  const canGoNext = props.title.trim().length > 0 && props.selectedDates.length > 0;

  const applyToCell = (key: string) => {
    const p = painting.current;
    if (!p || p.visited.has(key)) return;
    p.visited.add(key);
    props.onSetCell(key, p.targetState);
  };

  const handleDown = (key: string, on: boolean) => {
    painting.current = { targetState: !on, visited: new Set([key]) };
    props.onSetCell(key, !on);
  };

  // Unified drag tracker — works for mouse and touch via elementFromPoint
  // (sidesteps touch implicit pointer capture on the start cell).
  const handleRootPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!painting.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cell = el?.closest<HTMLElement>("[data-paint-key]");
    if (!cell) return;
    const key = cell.dataset.paintKey;
    if (key) applyToCell(key);
  };

  const handleUp = () => { painting.current = null; };

  if (step === 1) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
          Step 1 of 2 · 기본 정보 + 날짜
        </div>
        <div>
          <Label htmlFor="ev-title-m">이벤트 이름</Label>
          <Input
            id="ev-title-m"
            className="mt-2"
            value={props.title}
            onChange={(e) => props.onTitleChange(e.target.value)}
            placeholder="예: 2분기 1:1 미팅"
          />
        </div>
        <div>
          <Label>미팅 길이</Label>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {[15, 30, 45, 60].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => props.onPeriodChange(p)}
                className={cn(
                  "py-2 rounded-md text-sm border",
                  p === props.periodMinutes ? "bg-primary text-primary-foreground border-primary" : "border-border"
                )}
              >
                {p}분
              </button>
            ))}
          </div>
        </div>
        <MultiDateCalendar selectedDates={props.selectedDates} onToggleDate={props.onToggleDate} />
        <Button
          size="lg"
          disabled={!canGoNext}
          onClick={() => {
            setStep(2);
            if (!activeDate && props.selectedDates.length > 0) setActiveDate(props.selectedDates[0]!);
          }}
        >
          다음 →
        </Button>
      </div>
    );
  }

  // Step 2: paint one day
  const currentDate = activeDate ?? props.selectedDates[0]!;
  const axis = buildTimeAxis(props.dailyRange[0], props.dailyRange[1], props.periodMinutes);

  return (
    <div
      className="flex flex-col gap-4 p-4"
      onPointerMove={handleRootPointerMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerLeave={handleUp}
    >
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setStep(1)} className="text-sm hover:underline">← 이전</button>
        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
          Step 2 · 시간 페인팅
        </div>
        <div className="text-xs text-muted-foreground">{props.slotCount} 슬롯</div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {props.selectedDates.map((ymd) => (
          <button
            key={ymd}
            type="button"
            onClick={() => setActiveDate(ymd)}
            className={cn(
              "flex-none px-3 py-2 rounded-lg text-xs min-w-[56px] text-center",
              ymd === currentDate ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            <span className="block text-[9px] opacity-70 mb-0.5">{format(parseISO(ymd), "EEE")}</span>
            <span className="font-semibold">{format(parseISO(ymd), "M/d")}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold">{format(parseISO(currentDate), "M/d (EEE)")}</span>
        <div className="flex items-center gap-1">
          <input type="time" value={props.dailyRange[0]} onChange={(e) => props.onChangeRange([e.target.value, props.dailyRange[1]])}
            className="border rounded px-1.5 py-0.5 w-20" />
          <span>–</span>
          <input type="time" value={props.dailyRange[1]} onChange={(e) => props.onChangeRange([props.dailyRange[0], e.target.value])}
            className="border rounded px-1.5 py-0.5 w-20" />
        </div>
      </div>

      <div className="grid grid-cols-[36px_1fr] gap-1">
        {axis.map((hhmm) => {
          const key = cellKey(currentDate, hhmm);
          const on = props.paintedCells.has(key);
          return (
            <Fragment key={hhmm}>
              <div className="text-right text-[10px] text-muted-foreground leading-[22px] tabular-nums pr-1">
                {hhmm}
              </div>
              <div
                role="gridcell"
                data-paint-key={key}
                aria-selected={on}
                onPointerDown={() => handleDown(key, on)}
                className={cn(
                  "h-[22px] rounded select-none transition-colors touch-none",
                  on ? "bg-accent" : "bg-muted"
                )}
              />
            </Fragment>
          );
        })}
      </div>

      <div className="text-[10px] text-muted-foreground text-center p-2 bg-muted rounded">
        👆 꾹 눌러 드래그해서 연속된 시간을 한번에 칠하세요
      </div>

      <Button size="lg" disabled={!props.canSubmit} onClick={props.onSubmit}>
        {props.submitting ? "저장 중…" : "생성하기"}
      </Button>
    </div>
  );
}
