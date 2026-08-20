import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/useAuth";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { eventCreateSchema } from "@meetplan/shared";
import { toZonedInstant } from "@meetplan/shared";
import type { Slot, EventType } from "@meetplan/shared";
import { BasicInfoForm } from "./BasicInfoForm";
import { MultiDateCalendar } from "./MultiDateCalendar";
import { TimePainter } from "./TimePainter";
import { MobileWizard } from "./MobileWizard";
import { CalendarBanner } from "./CalendarBanner";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { useEventCreateState, cellKey } from "./useEventCreateState";
import { buildSlotsFromPaintedCells } from "./generateSlots";
import { buildDisplayAxis } from "./timeAxis";
import { useGoogleCalendarBusy } from "../event-respond/useGoogleCalendarBusy";
import { slotsToPaintedCells } from "../event-edit/slotsToPaintedCells";
import { t } from "@/lib/i18n";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

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

  // Event type state
  const [eventType, setEventType] = useState<EventType>("meeting");
  const [stakeId, setStakeId] = useState("");

  const fromResult = (location.state as FromResultState) ?? null;
  const initialState = fromResult
    ? (() => {
        const { selectedDates, paintedCells, dailyRange } = slotsToPaintedCells(
          fromResult.sourceSlots,
          fromResult.sourcePeriod,
          HOST_TZ
        );
        return {
          title: `${fromResult.sourceTitle} ${t('create.followUpSuffix')}`,
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
    setNotes,
    setPeriod,
    toggleDate,
    setDailyRange,
    setCellPainted,
  } = useEventCreateState(initialState);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const calendar = useGoogleCalendarBusy();
  const [calendarChoice, setCalendarChoice] = useState<"pending" | "dismissed">("pending");

  const handleCalendarConnect = async () => {
    await calendar.connectCalendar();
  };

  const handleCalendarApply = async () => {
    if (state.selectedDates.length === 0) return;
    const sorted = [...state.selectedDates].sort();
    const timeMin = toZonedInstant(sorted[0]!, "00:00", HOST_TZ);
    const timeMax = toZonedInstant(sorted[sorted.length - 1]!, "23:59", HOST_TZ);
    const success = await calendar.syncCalendar(timeMin, timeMax);
    if (success) setCalendarChoice("dismissed");
  };

  const busyCells = useMemo(() => {
    if (eventType === "ward_visit") return new Set<string>();
    if (!calendar.synced || calendar.busyIntervals.length === 0) return new Set<string>();
    const busy = new Set<string>();
    const axis = buildDisplayAxis(state.dailyRange, state.periodMinutes, state.paintedCells);
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
  }, [eventType, calendar.synced, calendar.busyIntervals, state.selectedDates, state.dailyRange, state.periodMinutes, state.paintedCells]);

  const slots = eventType === "meeting"
    ? buildSlotsFromPaintedCells(state.paintedCells, state.periodMinutes, HOST_TZ)
    : [];

  const canCreate = eventType === "ward_visit"
    ? state.title.trim().length > 0 && stakeId.length > 0 && state.selectedDates.length > 0 && !submitting
    : state.title.trim().length > 0 && slots.length > 0 && !submitting;

  const handleCreate = async () => {
    if (!user) return;
    setError(null);
    setSubmitting(true);
    try {
      const notesValue = state.notes.trim() || undefined;
      const payload = eventType === "ward_visit"
        ? {
            title: state.title.trim(),
            description: notesValue,
            periodMinutes: 0,
            timezone: HOST_TZ,
            slots: [],
            eventType: "ward_visit" as const,
            stakeId,
            wardVisitDates: state.selectedDates,
          }
        : {
            title: state.title.trim(),
            description: notesValue,
            periodMinutes: state.periodMinutes,
            timezone: HOST_TZ,
            slots,
          };

      const parsed = eventCreateSchema.safeParse(payload);
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message ?? t('common.inputError'));
        setSubmitting(false);
        return;
      }
      const docRef = await addDoc(collection(db, "events"), {
        ...parsed.data,
        ownerUid: user.uid,
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate(`/events/${docRef.id}/result`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.saveFailed'));
      setSubmitting(false);
    }
  };

  if (!isDesktop) {
    return (
      <>
        <MobileHeader logo onBack={() => navigate("/dashboard")} />
        <MobileWizard
          title={state.title}
          onTitleChange={setTitle}
          notes={state.notes}
          onNotesChange={setNotes}
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
          eventType={eventType}
          onEventTypeChange={setEventType}
          stakeId={stakeId}
          onStakeChange={setStakeId}
        />
      </>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between pb-6 border-b">
        <Link to="/dashboard" className="text-sm hover:underline">{t('create.back')}</Link>
        <h1 className="font-semibold">{t('create.pageTitle')}</h1>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Button onClick={handleCreate} disabled={!canCreate}>
            {submitting ? t('common.saving') : t('create.submit')}
          </Button>
        </div>
      </header>

      <div className="py-8 flex flex-col gap-10">
        <BasicInfoForm
          title={state.title}
          onTitleChange={setTitle}
          notes={state.notes}
          onNotesChange={setNotes}
          periodMinutes={state.periodMinutes}
          onPeriodChange={setPeriod}
          eventType={eventType}
          onEventTypeChange={setEventType}
          stakeId={stakeId}
          onStakeChange={setStakeId}
        />

        {eventType === "meeting" && (
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
                <Calendar size={12} /> {t('create.calendarSynced')}
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
        )}

        {eventType === "ward_visit" && (
          <section className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium mb-1">{t('ward.datesLabel')}</p>
              <p className="text-xs text-muted-foreground mb-3">{t('ward.datesHint')}</p>
              <div className="max-w-sm">
                <MultiDateCalendar
                  selectedDates={state.selectedDates}
                  onToggleDate={toggleDate}
                  sundayOnly
                />
              </div>
            </div>
          </section>
        )}
      </div>

      <footer className="sticky bottom-0 -mx-6 px-6 py-3 bg-muted/80 backdrop-blur border-t flex items-center justify-between text-sm">
        <div>
          {eventType === "meeting"
            ? t('create.slotsPreview', { count: slots.length })
            : state.selectedDates.length > 0
              ? t('ward.selectedSundays', { count: state.selectedDates.length })
              : ""}
        </div>
        {error && <div className="text-destructive">{error}</div>}
      </footer>
    </div>
  );
}
