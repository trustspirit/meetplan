import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
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
    <AppShell>
      <PageHeader
        title={t('edit.title')}
        subtitle={t('edit.metaDesc', { periodMinutes: event.periodMinutes })}
        backTo={`/events/${eventId}/result`}
        backLabel={event.title}
      />

      <div className="flex flex-col gap-6 pb-24">
        {responseCount > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={14} aria-hidden />
              {t('edit.hasResponses', { count: responseCount })}
            </div>
            <p className="mt-1 text-xs">{t('edit.warningDesc')}</p>
            <p className="mt-1 text-xs">{t('edit.warningLink')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_1fr]">
          <div className="lg:sticky lg:top-20">
            <MultiDateCalendar
              selectedDates={state.selectedDates}
              onToggleDate={toggleDate}
            />
          </div>
          <TimePainter
            selectedDates={state.selectedDates}
            dailyRange={state.dailyRange}
            periodMinutes={state.periodMinutes}
            paintedCells={state.paintedCells}
            onSetCell={setCellPainted}
            onChangeRange={setDailyRange}
          />
        </div>
      </div>

      <StickyActionBar>
        <span className="text-sm text-text-muted">
          {t('edit.slotsToUpdate', { count: newSlots.length })}
        </span>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-danger">{error}</span>}
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? t('common.saving') : t('edit.save')}
          </Button>
        </div>
      </StickyActionBar>
    </AppShell>
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
    return (
      <AppShell>
        <PageSkeleton variant="detail" />
      </AppShell>
    );
  }
  if (eventState.error || !event) {
    return (
      <AppShell>
        <EmptyState
          icon={<AlertCircle size={36} className="text-danger" aria-hidden />}
          title={eventState.error ?? t('edit.notFound')}
          action={
            <Link to="/dashboard">
              <Button variant="secondary">{t('common.backToDashboard')}</Button>
            </Link>
          }
        />
      </AppShell>
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
