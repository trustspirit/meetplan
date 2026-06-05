import { Fragment, useState, useRef, type PointerEvent } from "react";
import { format, parseISO } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MultiDateCalendar } from "./MultiDateCalendar";
import { CalendarBanner } from "./CalendarBanner";
import { buildTimeAxis } from "./timeAxis";
import { cellKey } from "./useEventCreateState";
import { PeriodPicker } from "./PeriodPicker";
import { t } from "@/lib/i18n";
import type { CalendarListItem } from "../event-respond/useGoogleCalendarBusy";

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
  busyCells?: Set<string>;
  calendarChoice?: "pending" | "dismissed";
  calendarSyncing?: boolean;
  calendarError?: string | null;
  calendarSynced?: boolean;
  onCalendarConnect?: () => void;
  onCalendarSkip?: () => void;
  calendarList?: CalendarListItem[];
  calendarSelectedId?: string | null;
  onCalendarIdChange?: (id: string) => void;
  onCalendarApply?: () => void;
}

export function MobileWizard(props: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [activeDate, setActiveDate] = useState<string | null>(null);
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
          {t('wizard.step1')}
        </div>
        <div>
          <Label htmlFor="ev-title-m">{t('form.eventTitle')}</Label>
          <Input
            id="ev-title-m"
            className="mt-2"
            value={props.title}
            onChange={(e) => props.onTitleChange(e.target.value)}
            placeholder={t('form.eventTitlePlaceholder')}
          />
        </div>
        <div>
          <Label>{t('form.meetingLength')}</Label>
          <div className="mt-2">
            <PeriodPicker value={props.periodMinutes} onChange={props.onPeriodChange} />
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
          {t('wizard.next')} →
        </Button>
      </div>
    );
  }

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
        <button type="button" onClick={() => setStep(1)} className="text-sm hover:underline">
          ← {t('wizard.prev')}
        </button>
        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
          {t('wizard.step2')}
        </div>
        <div className="text-xs text-muted-foreground">
          {t('wizard.slotCount', { count: props.slotCount })}
        </div>
      </div>

      {props.calendarChoice === "pending" && props.onCalendarConnect && (
        <CalendarBanner
          syncing={props.calendarSyncing ?? false}
          error={props.calendarError ?? null}
          onConnect={props.onCalendarConnect}
          onSkip={props.onCalendarSkip!}
          {...(props.calendarList ? { calendarList: props.calendarList } : {})}
          {...(props.calendarSelectedId !== undefined ? { selectedCalendarId: props.calendarSelectedId } : {})}
          {...(props.onCalendarIdChange ? { onCalendarIdChange: props.onCalendarIdChange } : {})}
          {...(props.onCalendarApply ? { onApply: props.onCalendarApply } : {})}
        />
      )}
      {props.calendarSynced && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Calendar size={11} /> {t('wizard.calendarSynced')}
        </p>
      )}

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
          const isBusy = props.busyCells?.has(key) ?? false;
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
                  on && !isBusy && "bg-accent",
                  on && isBusy && "bg-accent cell-busy",
                  !on && !isBusy && "bg-muted",
                  !on && isBusy && "bg-muted cell-busy",
                )}
              />
            </Fragment>
          );
        })}
      </div>

      {props.busyCells && props.busyCells.size > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-3 h-3 rounded-sm bg-muted cell-busy shrink-0" />
          {t('wizard.busyCellHint')}
        </div>
      )}

      <div className="text-[10px] text-muted-foreground text-center p-2 bg-muted rounded">
        {t('wizard.dragHint')}
      </div>

      <Button size="lg" disabled={!props.canSubmit} onClick={props.onSubmit}>
        {props.submitting ? t('common.saving') : t('create.submitMobile')}
      </Button>
    </div>
  );
}
