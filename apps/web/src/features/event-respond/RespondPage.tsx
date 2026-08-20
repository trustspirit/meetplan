import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { AlertCircle, Lock } from "lucide-react";
import { phoneRegex, normalizePhone } from "@meetplan/shared";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { submitResponseCallable } from "@/lib/callable";
import { useAuth } from "@/features/auth/useAuth";
import { useEventData } from "./useEventData";
import { useExistingResponse } from "./useExistingResponse";
import { useRespondState } from "./useRespondState";
import { slotsToCells } from "./slotsToCells";
import { RespondDesktop } from "./RespondDesktop";
import { RespondMobile } from "./RespondMobile";
import { WardVisitRespond } from "./WardVisitRespond";
import { SubmitSuccessAnon } from "./SubmitSuccessAnon";
import { SubmitSuccessAuthed } from "./SubmitSuccessAuthed";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/layout/PublicShell";
import { t } from "@/lib/i18n";

const VIEWER_TZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";

export default function RespondPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [search] = useSearchParams();
  const rid = search.get("rid");
  const token = search.get("t");
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const { user } = useAuth();
  const eventState = useEventData(eventId);
  const existing = useExistingResponse(eventId, rid, token);

  const prefill = useMemo(
    () => existing.response ? {
      name: existing.response.name,
      phone: existing.response.phone,
      ...(existing.response.note ? { note: existing.response.note } : {}),
      selectedSlotIds: existing.response.selectedSlotIds,
    } : undefined,
    [existing.response]
  );
  const { state, setName, setPhone, setNote, setSlotChecked, clearSlotsForDate } = useRespondState(prefill);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<
    | { kind: "anon"; editUrl: string; name: string; slotCount: number; periodMinutes: number }
    | { kind: "authed"; name: string; slotCount: number; periodMinutes: number }
    | null
  >(null);

  useEffect(() => {
    if (result) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (state.selectedSlotIds.size === 0 && !state.name.trim()) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [state.selectedSlotIds.size, state.name, result]);

  if (!eventId) return <Navigate to="/" replace />;
  if (eventState.loading || existing.loading) {
    return <PublicShell><PageSkeleton variant="detail" /></PublicShell>;
  }
  if (eventState.error || !eventState.event) {
    return (
      <PublicShell>
        <EmptyState
          icon={<AlertCircle size={36} className="text-danger" aria-hidden />}
          title={t('respond.eventNotFound')}
          description={eventState.error ?? t('respond.eventNotFoundHint')}
          action={
            <Button variant="secondary" onClick={() => window.location.reload()}>
              {t('respond.retry')}
            </Button>
          }
        />
      </PublicShell>
    );
  }
  if (eventState.event.status === "closed") {
    return (
      <PublicShell>
        <EmptyState
          icon={<Lock size={36} aria-hidden />}
          title={t('respond.eventClosed')}
          description={t('respond.eventClosedHint')}
        />
      </PublicShell>
    );
  }
  if (result) {
    return result.kind === "anon"
      ? <SubmitSuccessAnon name={result.name} editUrl={result.editUrl} slotCount={result.slotCount} periodMinutes={result.periodMinutes} />
      : <SubmitSuccessAuthed name={result.name} slotCount={result.slotCount} periodMinutes={result.periodMinutes} />;
  }

  const event = eventState.event;

  // Ward visit events use a completely different respond flow
  if (event.eventType === "ward_visit") {
    return (
      <WardVisitRespond
        event={event}
        eventId={eventId}
        user={user}
        rid={rid}
        token={token}
      />
    );
  }

  const grid = slotsToCells(event.slots, VIEWER_TZ);

  const nameOk = state.name.trim().length > 0;
  const phoneOk = phoneRegex.test(state.phone);
  const slotsOk = state.selectedSlotIds.size > 0;
  const canSubmit = nameOk && phoneOk && slotsOk && !submitting;

  const handleSubmit = async () => {
    if (!eventId) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      // 편집 경로 결정:
      //  - 익명: URL 쿼리의 rid + token
      //  - 로그인: 기존 응답이 있으면 그 id를 rid로 전달 (중복 doc 방지)
      //  - 둘 다 아니면 신규 생성
      const note = state.note.trim();
      const editArgs =
        rid && token
          ? { rid, token }
          : user && existing.response
          ? { rid: existing.response.id }
          : {};
      const { data } = await submitResponseCallable({
        eventId,
        name: state.name.trim(),
        phone: normalizePhone(state.phone),
        ...(note ? { note } : {}),
        selectedSlotIds: [...state.selectedSlotIds],
        ...editArgs,
      });

      if (data.rawToken) {
        // 신규 익명 제출 — 서버가 새 토큰 발급
        const url = `${window.location.origin}/e/${eventId}?rid=${data.responseId}&t=${data.rawToken}`;
        setResult({ kind: "anon", editUrl: url, name: state.name.trim(), slotCount: state.selectedSlotIds.size, periodMinutes: event.periodMinutes });
      } else if (user) {
        // 로그인 제출 (신규 또는 수정) — 토큰 개념 없음
        setResult({ kind: "authed", name: state.name.trim(), slotCount: state.selectedSlotIds.size, periodMinutes: event.periodMinutes });
      } else if (rid && token) {
        // 익명 편집 — 기존 rid/token 재사용해 동일 편집 URL 유지
        const url = `${window.location.origin}/e/${eventId}?rid=${rid}&t=${token}`;
        setResult({ kind: "anon", editUrl: url, name: state.name.trim(), slotCount: state.selectedSlotIds.size, periodMinutes: event.periodMinutes });
      } else {
        // 이 분기는 원칙적으로 도달 불가 (익명 + 신규인데 rawToken 없음은 서버 응답 계약 위반).
        setResult({ kind: "authed", name: state.name.trim(), slotCount: state.selectedSlotIds.size, periodMinutes: event.periodMinutes });
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : t('common.saveFailed'));
      setSubmitting(false);
    }
  };

  const commonProps = {
    event,
    grid,
    state,
    onNameChange: setName,
    onPhoneChange: setPhone,
    onNoteChange: setNote,
    onSetSlot: setSlotChecked,
    onClearDate: clearSlotsForDate,
    viewerTz: VIEWER_TZ,
    canSubmit,
    submitting,
    onSubmit: handleSubmit,
    submitError,
  };

  return (
    <PublicShell>
      {isDesktop ? <RespondDesktop {...commonProps} /> : <RespondMobile {...commonProps} />}
    </PublicShell>
  );
}
