import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { useEventData } from "@/features/event-respond/useEventData";
import { useResponses } from "@/features/event-result/useResponses";
import { MultiDateCalendar } from "@/features/event-create/MultiDateCalendar";
import { TimePainter } from "@/features/event-create/TimePainter";
import {
  useEventCreateState,
  type EventCreateState,
} from "@/features/event-create/useEventCreateState";
import { buildSlotsFromPaintedCells } from "@/features/event-create/generateSlots";
import { updateEventSlotsCallable } from "@/lib/callable";
import { slotsToPaintedCells } from "./slotsToPaintedCells";
import { t } from "@/lib/i18n";
import type { MeetplanEvent } from "@meetplan/shared";
import type { NavigateFunction } from "react-router-dom";

const HOST_TZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";

interface EditorProps {
  eventId: string;
  event: MeetplanEvent;
  initialState: Partial<EventCreateState>;
  responseCount: number;
  navigate: NavigateFunction;
}

function EventEditor({ eventId, event, initialState, responseCount, navigate }: EditorProps) {
  const { state, toggleDate, setDailyRange, setCellPainted } = useEventCreateState(initialState);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newSlots = useMemo(
    () => buildSlotsFromPaintedCells(state.paintedCells, state.periodMinutes, HOST_TZ),
    [state.paintedCells, state.periodMinutes]
  );

  const canSave = newSlots.length > 0 && !saving;

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await updateEventSlotsCallable({ eventId, slots: newSlots });
      navigate(`/events/${eventId}/result`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.saveFailed'));
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between pb-6 border-b">
        <Link to={`/events/${eventId}/result`} className="text-sm hover:underline">
          {t('edit.back')}
        </Link>
        <h1 className="font-semibold">{t('edit.title')}</h1>
        <Button onClick={handleSave} disabled={!canSave}>
          {saving ? t('common.saving') : t('edit.save')}
        </Button>
      </header>

      {responseCount > 0 && (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={14} />
            {t('edit.hasResponses', { count: responseCount })}
          </div>
          <p className="text-xs mt-1">{t('edit.warningDesc')}</p>
          <p className="text-xs mt-1 text-amber-800">{t('edit.warningLink')}</p>
        </div>
      )}

      <section className="mt-6 rounded-md border p-4 bg-muted/20 text-sm">
        <div className="font-semibold">{event.title}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {t('edit.metaDesc', { periodMinutes: event.periodMinutes })}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        <MultiDateCalendar
          selectedDates={state.selectedDates}
          onToggleDate={toggleDate}
        />
        <TimePainter
          selectedDates={state.selectedDates}
          dailyRange={state.dailyRange}
          periodMinutes={state.periodMinutes}
          paintedCells={state.paintedCells}
          onSetCell={setCellPainted}
          onChangeRange={setDailyRange}
        />
      </section>

      <footer className="sticky bottom-0 -mx-6 px-6 py-3 bg-muted/80 backdrop-blur border-t flex items-center justify-between text-sm mt-8">
        <div>
          {t('edit.slotsToUpdate', { count: newSlots.length })}
        </div>
        {error && <div className="text-destructive text-xs">{error}</div>}
      </footer>
    </div>
  );
}

export default function EventEditPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const eventState = useEventData(eventId);
  const event = eventState.event;

  const isOwner = !!event && !!user && event.ownerUid === user.uid;
  const responsesState = useResponses(isOwner ? eventId : undefined);

  if (!eventId) return <Navigate to="/dashboard" replace />;
  if (authLoading || eventState.loading) {
    return <div className="p-10 text-center text-muted-foreground">{t('common.loading')}</div>;
  }
  if (eventState.error || !event) {
    return (
      <div className="p-10 text-center">
        <p className="text-destructive">{eventState.error ?? t('edit.notFound')}</p>
        <Link to="/dashboard" className="text-sm hover:underline">{t('common.backToDashboard')}</Link>
      </div>
    );
  }
  if (!user || event.ownerUid !== user.uid) {
    return <Navigate to="/dashboard" replace />;
  }

  const derived = slotsToPaintedCells(event.slots, event.periodMinutes, HOST_TZ);
  const initialState: Partial<EventCreateState> = {
    title: event.title,
    periodMinutes: event.periodMinutes,
    selectedDates: derived.selectedDates,
    paintedCells: derived.paintedCells,
    dailyRange: derived.dailyRange,
  };

  return (
    <EventEditor
      eventId={eventId}
      event={event}
      initialState={initialState}
      responseCount={responsesState.responses.length}
      navigate={navigate}
    />
  );
}
