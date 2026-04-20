import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
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

const HOST_TZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";

export default function EventEditPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const eventState = useEventData(eventId);
  const event = eventState.event;

  // Ownership gate — only owner can subscribe to responses
  const isOwner = !!event && !!user && event.ownerUid === user.uid;
  const responsesState = useResponses(isOwner ? eventId : undefined);

  // Reverse-derive painter state from existing event
  const initialCells = useMemo<Partial<EventCreateState> | undefined>(() => {
    if (!event) return undefined;
    const derived = slotsToPaintedCells(event.slots, event.periodMinutes, HOST_TZ);
    return {
      title: event.title,
      periodMinutes: event.periodMinutes,
      selectedDates: derived.selectedDates,
      paintedCells: derived.paintedCells,
      dailyRange: derived.dailyRange,
    };
  }, [event]);

  const { state, toggleDate, setDailyRange, setCellPainted } = useEventCreateState(initialCells);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newSlots = useMemo(
    () => buildSlotsFromPaintedCells(state.paintedCells, state.periodMinutes, HOST_TZ),
    [state.paintedCells, state.periodMinutes]
  );

  const canSave = newSlots.length > 0 && !saving;

  const handleSave = async () => {
    if (!eventId) return;
    setError(null);
    setSaving(true);
    try {
      await updateEventSlotsCallable({ eventId, slots: newSlots });
      navigate(`/events/${eventId}/result`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
      setSaving(false);
    }
  };

  // ---- early returns (all after hooks) ----
  if (!eventId) return <Navigate to="/dashboard" replace />;
  if (authLoading || eventState.loading) {
    return <div className="p-10 text-center text-muted-foreground">불러오는 중…</div>;
  }
  if (eventState.error || !event) {
    return (
      <div className="p-10 text-center">
        <p className="text-destructive">{eventState.error ?? "이벤트를 찾을 수 없습니다"}</p>
        <Link to="/dashboard" className="text-sm hover:underline">← 대시보드로</Link>
      </div>
    );
  }
  if (!user || event.ownerUid !== user.uid) {
    return <Navigate to="/dashboard" replace />;
  }

  const responseCount = responsesState.responses.length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between pb-6 border-b">
        <Link to={`/events/${eventId}/result`} className="text-sm hover:underline">
          ← 결과로 돌아가기
        </Link>
        <h1 className="font-semibold">이벤트 편집</h1>
        <Button onClick={handleSave} disabled={!canSave}>
          {saving ? "저장 중…" : "저장"}
        </Button>
      </header>

      {responseCount > 0 && (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <b>⚠ 응답 {responseCount}명 있음</b>
          <p className="text-xs mt-1">
            저장 시 <b>삭제된 시간을 선택했던 응답만</b> 해당 선택이 자동 제거되고,
            나머지 선택은 그대로 유지됩니다. 새로 추가된 시간은 참가자가 다시 접속해야 선택 가능해요.
          </p>
          <p className="text-xs mt-1 text-amber-800">
            공유 링크(<code>/e/...</code>)는 그대로 유지됩니다.
          </p>
        </div>
      )}

      <section className="mt-6 rounded-md border p-4 bg-muted/20 text-sm">
        <div className="font-semibold">{event.title}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {event.periodMinutes}분 미팅 · 제목/길이는 편집할 수 없어요 (삭제 후 재생성 필요)
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
          업데이트될 슬롯: <span className="font-semibold text-accent">{newSlots.length}개</span>
        </div>
        {error && <div className="text-destructive text-xs">{error}</div>}
      </footer>
    </div>
  );
}
