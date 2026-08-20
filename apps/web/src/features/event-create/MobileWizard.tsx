import { Fragment, useState, useRef, type PointerEvent } from "react";
import { format, parseISO } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MultiDateCalendar } from "./MultiDateCalendar";
import { CalendarBanner } from "./CalendarBanner";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { buildDisplayAxis, timesOutsideRange } from "./timeAxis";
import { cellKey } from "./useEventCreateState";
import { PeriodPicker } from "./PeriodPicker";
import { t } from "@/lib/i18n";
import { STAKES } from "@meetplan/shared";
import type { EventType } from "@meetplan/shared";
import type { CalendarListItem } from "../event-respond/useGoogleCalendarBusy";

interface Props {
  title: string;
  onTitleChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
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
  // ward_visit
  eventType: EventType;
  onEventTypeChange: (v: EventType) => void;
  stakeId: string;
  onStakeChange: (v: string) => void;
}

export function MobileWizard(props: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const painting = useRef<{ targetState: boolean; visited: Set<string> } | null>(null);

  const isWardVisit = props.eventType === "ward_visit";
  const canGoNextMeeting = props.title.trim().length > 0 && props.selectedDates.length > 0;
  const canSubmitWardVisit = props.title.trim().length > 0 && props.stakeId.length > 0 && props.selectedDates.length > 0;

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
      <div className="flex flex-col gap-6 p-4 pb-8">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-surface-subtle overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-primary" />
          </div>
          <span className="text-2xs font-medium text-text-muted">
            {isWardVisit
              ? t('eventType.wardVisit')
              : t('wizard.progress', { current: 1, total: 2 })}
          </span>
        </div>

        {/* Event type toggle */}
        <div>
          <Label>{t('eventType.label')}</Label>
          <div className="mt-2 flex rounded-lg border border-border overflow-hidden">
            {(["meeting", "ward_visit"] as EventType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => props.onEventTypeChange(type)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium transition-colors",
                  type !== "meeting" && "border-l border-border",
                  props.eventType === type
                    ? "bg-primary text-primary-foreground"
                    : "text-text-muted hover:text-text"
                )}
              >
                {type === "meeting" ? t('eventType.meeting') : t('eventType.wardVisit')}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
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

        {/* Notes */}
        <div>
          <Label htmlFor="ev-notes-m">{t('form.notes')}</Label>
          <textarea
            id="ev-notes-m"
            className="mt-2 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus-visible:ring-ring resize-none"
            rows={3}
            maxLength={500}
            placeholder={t('form.notesPlaceholder')}
            value={props.notes}
            onChange={(e) => props.onNotesChange(e.target.value)}
          />
        </div>

        {/* Ward visit: stake selector (slides in) */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          isWardVisit ? "max-h-40 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}>
          <Label htmlFor="ev-stake-m">{t('ward.stakeLabel')}</Label>
          <select
            id="ev-stake-m"
            value={props.stakeId}
            onChange={(e) => props.onStakeChange(e.target.value)}
            className="mt-2 w-full rounded-md border border-border-strong bg-surface px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus-visible:ring-ring"
          >
            <option value="">{t('ward.stakePlaceholder')}</option>
            {STAKES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Meeting: period picker */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          !isWardVisit ? "max-h-40 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}>
          <Label>{t('form.meetingLength')}</Label>
          <div className="mt-2">
            <PeriodPicker value={props.periodMinutes} onChange={props.onPeriodChange} />
          </div>
        </div>

        {/* Date picker */}
        <div>
          {isWardVisit && (
            <p className="text-xs text-text-muted mb-2">{t('ward.datesLabel')} — {t('ward.selectSundayHint')}</p>
          )}
          <MultiDateCalendar
            selectedDates={props.selectedDates}
            onToggleDate={props.onToggleDate}
            sundayOnly={isWardVisit}
          />
        </div>

        {/* CTA button */}
        {isWardVisit ? (
          <Button
            size="lg"
            disabled={!canSubmitWardVisit || props.submitting}
            onClick={props.onSubmit}
          >
            {props.submitting ? t('common.saving') : t('ward.submitMobile')}
          </Button>
        ) : (
          <Button
            size="lg"
            disabled={!canGoNextMeeting}
            onClick={() => {
              setStep(2);
              if (!activeDate && props.selectedDates.length > 0) setActiveDate(props.selectedDates[0]!);
            }}
          >
            {t('wizard.next')} →
          </Button>
        )}
      </div>
    );
  }

  // Step 2: time painting (meeting only)
  const currentDate = activeDate ?? props.selectedDates[0]!;
  const axis = buildDisplayAxis(props.dailyRange, props.periodMinutes, props.paintedCells);
  const outsideTimes = timesOutsideRange(props.dailyRange, props.periodMinutes, props.paintedCells);

  return (
    <div
      className="flex flex-col gap-4 p-4 pb-24"
      onPointerMove={handleRootPointerMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerLeave={handleUp}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="min-h-touch -ml-2 px-2 text-sm text-text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          ← {t('wizard.prev')}
        </button>
        <div className="flex-1 h-1 rounded-full bg-surface-subtle overflow-hidden">
          <div className="h-full w-full rounded-full bg-primary" />
        </div>
        <span className="text-2xs font-medium text-text-muted">
          {t('wizard.progress', { current: 2, total: 2 })}
        </span>
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
        <p className="text-2xs text-text-muted flex items-center gap-1">
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
              ymd === currentDate ? "bg-primary text-primary-foreground" : "bg-surface-subtle"
            )}
          >
            <span className="block text-2xs opacity-70 mb-0.5">{format(parseISO(ymd), "EEE")}</span>
            <span className="font-semibold">{format(parseISO(ymd), "M/d")}</span>
          </button>
        ))}
      </div>

      {/* 표시 구간 — 모든 날짜 공통. 날짜 라벨과 분리해 오해를 막는다. */}
      <div className="rounded-lg border bg-surface-subtle px-3 py-2.5">
        <div className="text-2xs text-text-muted mb-1.5">{t('painter.rangeLabel')}</div>
        <div className="flex items-center gap-2">
          <input
            type="time"
            aria-label={t('painter.rangeLabel')}
            value={props.dailyRange[0]}
            onChange={(e) => props.onChangeRange([e.target.value, props.dailyRange[1]])}
            className="h-11 flex-1 rounded-md border border-border-strong bg-surface px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="text-text-muted">–</span>
          <input
            type="time"
            aria-label={t('painter.rangeLabel')}
            value={props.dailyRange[1]}
            onChange={(e) => props.onChangeRange([props.dailyRange[0], e.target.value])}
            className="h-11 flex-1 rounded-md border border-border-strong bg-surface px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {outsideTimes.length > 0 && (
        <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-2xs text-warning">
          {t('painter.expandedNotice', { times: outsideTimes.join(', ') })}
        </div>
      )}

      <div className="text-sm font-semibold">
        {format(parseISO(currentDate), "M/d (EEE)")}
      </div>

      <div className="grid grid-cols-[36px_1fr] gap-1">
        {axis.map((hhmm) => {
          const key = cellKey(currentDate, hhmm);
          const on = props.paintedCells.has(key);
          const isBusy = props.busyCells?.has(key) ?? false;
          return (
            <Fragment key={hhmm}>
              <div className="text-right text-2xs text-text-muted leading-[22px] tabular-nums pr-1">
                {hhmm}
              </div>
              <div
                role="gridcell"
                data-paint-key={key}
                aria-selected={on}
                onPointerDown={() => handleDown(key, on)}
                className={cn(
                  "h-[22px] rounded select-none transition-colors touch-none",
                  on && !isBusy && "bg-primary",
                  on && isBusy && "bg-primary cell-busy",
                  !on && !isBusy && "bg-surface-subtle",
                  !on && isBusy && "bg-surface-subtle cell-busy",
                )}
              />
            </Fragment>
          );
        })}
      </div>

      {props.busyCells && props.busyCells.size > 0 && (
        <div className="flex items-center gap-1.5 text-2xs text-text-muted">
          <span className="inline-block w-3 h-3 rounded-sm bg-surface-subtle cell-busy shrink-0" />
          {t('wizard.busyCellHint')}
        </div>
      )}

      <div className="text-2xs text-text-muted text-center p-2 bg-surface-subtle rounded">
        {t('wizard.dragHint')}
      </div>

      <StickyActionBar>
        <span className="text-sm text-text-muted">
          {t('wizard.slotCount', { count: props.slotCount })}
        </span>
        <Button size="lg" disabled={!props.canSubmit} onClick={props.onSubmit}>
          {props.submitting ? t('common.saving') : t('create.submitMobile')}
        </Button>
      </StickyActionBar>
    </div>
  );
}
