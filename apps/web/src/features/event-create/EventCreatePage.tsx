import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/useAuth";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { eventCreateSchema } from "@meetplan/shared";
import { toZonedInstant } from "@meetplan/shared";
import type { Slot } from "@meetplan/shared";
import { BasicInfoForm } from "./BasicInfoForm";
import { MultiDateCalendar } from "./MultiDateCalendar";
import { TimePainter } from "./TimePainter";
import { MobileWizard } from "./MobileWizard";
import { CalendarBanner } from "./CalendarBanner";
import { useEventCreateState, cellKey } from "./useEventCreateState";
import { buildSlotsFromPaintedCells } from "./generateSlots";
import { buildTimeAxis } from "./timeAxis";
import { useGoogleCalendarBusy } from "../event-respond/useGoogleCalendarBusy";
import { slotsToPaintedCells } from "../event-edit/slotsToPaintedCells";

// 브라우저의 IANA TZ 자동 감지, 폴백 "Asia/Seoul"
const HOST_TZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";

type FromResultState = {
  sourceTitle: string;
  sourceSlots: Slot[];
  sourcePeriod: number;
} | null;

export default function EventCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-populate from result page if navigated with source state
  const fromResult = (location.state as FromResultState) ?? null;
  const initialState = fromResult
    ? (() => {
        const { selectedDates, paintedCells, dailyRange } = slotsToPaintedCells(
          fromResult.sourceSlots,
          fromResult.sourcePeriod,
          HOST_TZ
        );
        return {
          title: `${fromResult.sourceTitle} (후속)`,
          periodMinutes: fromResult.sourcePeriod,
          selectedDates,
          paintedCells,
          dailyRange,
        };
      })()
    : undefined;

  const {
    state,
    setTitle,
    setPeriod,
    toggleDate,
    setDailyRange,
    setCellPainted,
  } = useEventCreateState(initialState);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  // Google Calendar busy-time integration (opt-in)
  const calendar = useGoogleCalendarBusy();
  const [calendarChoice, setCalendarChoice] = useState<"pending" | "dismissed">("pending");

  const handleCalendarConnect = async () => {
    await calendar.connectCalendar();
    // On success, calendarList is populated → CalendarBanner shows picker automatically
  };

  const handleCalendarApply = async () => {
    if (state.selectedDates.length === 0) return;
    const sorted = [...state.selectedDates].sort();
    const timeMin = toZonedInstant(sorted[0]!, "00:00", HOST_TZ);
    const timeMax = toZonedInstant(sorted[sorted.length - 1]!, "23:59", HOST_TZ);
    const success = await calendar.syncCalendar(timeMin, timeMax);
    if (success) setCalendarChoice("dismissed");
  };

  // Compute busy cell keys by checking each grid cell against freeBusy intervals
  const busyCells = useMemo(() => {
    if (!calendar.synced || calendar.busyIntervals.length === 0) return new Set<string>();
    const busy = new Set<string>();
    const axis = buildTimeAxis(state.dailyRange[0], state.dailyRange[1], state.periodMinutes);
    for (const ymd of state.selectedDates) {
      for (const hhmm of axis) {
        const startMs = new Date(toZonedInstant(ymd, hhmm, HOST_TZ)).getTime();
        const endMs = startMs + state.periodMinutes * 60 * 1000;
        for (const interval of calendar.busyIntervals) {
          if (startMs < new Date(interval.end).getTime() && new Date(interval.start).getTime() < endMs) {
            busy.add(cellKey(ymd, hhmm));
            break;
          }
        }
      }
    }
    return busy;
  }, [calendar.synced, calendar.busyIntervals, state.selectedDates, state.dailyRange, state.periodMinutes]);

  const slots = buildSlotsFromPaintedCells(state.paintedCells, state.periodMinutes, HOST_TZ);
  const canCreate = state.title.trim().length > 0 && slots.length > 0 && !submitting;

  const handleCreate = async () => {
    if (!user) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        title: state.title.trim(),
        periodMinutes: state.periodMinutes,
        timezone: HOST_TZ,
        slots,
      };
      const parsed = eventCreateSchema.safeParse(payload);
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message ?? "입력 오류");
        setSubmitting(false);
        return;
      }
      const doc = await addDoc(collection(db, "events"), {
        ...parsed.data,
        ownerUid: user.uid,
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate(`/events/${doc.id}/result`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
      setSubmitting(false);
    }
  };

  if (!isDesktop) {
    return (
      <MobileWizard
        title={state.title}
        onTitleChange={setTitle}
        periodMinutes={state.periodMinutes}
        onPeriodChange={setPeriod}
        selectedDates={state.selectedDates}
        onToggleDate={toggleDate}
        dailyRange={state.dailyRange}
        onChangeRange={setDailyRange}
        paintedCells={state.paintedCells}
        onSetCell={setCellPainted}
        onSubmit={handleCreate}
        submitting={submitting}
        canSubmit={canCreate}
        slotCount={slots.length}
        busyCells={busyCells}
        calendarChoice={calendarChoice}
        calendarSyncing={calendar.loading}
        calendarError={calendar.error}
        calendarSynced={calendar.synced}
        onCalendarConnect={handleCalendarConnect}
        onCalendarSkip={() => setCalendarChoice("dismissed")}
        calendarList={calendar.calendarList}
        calendarSelectedId={calendar.selectedCalendarId}
        onCalendarIdChange={calendar.setSelectedCalendarId}
        onCalendarApply={handleCalendarApply}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between pb-6 border-b">
        <Link to="/dashboard" className="text-sm hover:underline">← 돌아가기</Link>
        <h1 className="font-semibold">새 이벤트 만들기</h1>
        <Button onClick={handleCreate} disabled={!canCreate}>
          {submitting ? "저장 중…" : "생성"}
        </Button>
      </header>

      <div className="py-8 flex flex-col gap-10">
        <BasicInfoForm
          title={state.title}
          onTitleChange={setTitle}
          periodMinutes={state.periodMinutes}
          onPeriodChange={setPeriod}
        />
        <section className="flex flex-col gap-4">
          {calendarChoice === "pending" && (
            <CalendarBanner
              syncing={calendar.loading}
              error={calendar.error}
              onConnect={handleCalendarConnect}
              onSkip={() => setCalendarChoice("dismissed")}
              disabled={state.selectedDates.length === 0}
              calendarList={calendar.calendarList}
              selectedCalendarId={calendar.selectedCalendarId}
              onCalendarIdChange={calendar.setSelectedCalendarId}
              onApply={handleCalendarApply}
            />
          )}
          {calendar.synced && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>📅</span> 구글 캘린더 연동됨 — 줄무늬 셀에 기존 일정이 있습니다
            </p>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
            <MultiDateCalendar selectedDates={state.selectedDates} onToggleDate={toggleDate} />
            <TimePainter
              selectedDates={state.selectedDates}
              dailyRange={state.dailyRange}
              periodMinutes={state.periodMinutes}
              paintedCells={state.paintedCells}
              onSetCell={setCellPainted}
              onChangeRange={setDailyRange}
              busyCells={busyCells}
            />
          </div>
        </section>
      </div>

      <footer className="sticky bottom-0 -mx-6 px-6 py-3 bg-muted/80 backdrop-blur border-t flex items-center justify-between text-sm">
        <div>
          자동 생성될 슬롯: <span className="font-semibold text-accent">{slots.length}개</span>
        </div>
        {error && <div className="text-destructive">{error}</div>}
      </footer>
    </div>
  );
}
