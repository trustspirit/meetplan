import { useMemo, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
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
import { SubmitSuccessAnon } from "./SubmitSuccessAnon";
import { SubmitSuccessAuthed } from "./SubmitSuccessAuthed";

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
      selectedSlotIds: existing.response.selectedSlotIds,
    } : undefined,
    [existing.response]
  );
  const { state, setName, setPhone, setSlotChecked } = useRespondState(prefill);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<
    | { kind: "anon"; editUrl: string; name: string; slotCount: number }
    | { kind: "authed"; name: string; slotCount: number }
    | null
  >(null);

  if (!eventId) return <Navigate to="/" replace />;
  if (eventState.loading || existing.loading) {
    return <div className="p-10 text-center text-muted-foreground">불러오는 중…</div>;
  }
  if (eventState.error || !eventState.event) {
    return (
      <div className="p-10 text-center">
        <p className="text-destructive font-medium">{eventState.error ?? "이벤트를 찾을 수 없습니다"}</p>
      </div>
    );
  }
  if (eventState.event.status === "closed") {
    return (
      <div className="p-10 text-center">
        <h2 className="text-lg font-semibold">마감된 이벤트입니다</h2>
        <p className="text-sm text-muted-foreground mt-2">호스트에게 문의해주세요.</p>
      </div>
    );
  }
  if (result) {
    return result.kind === "anon"
      ? <SubmitSuccessAnon name={result.name} editUrl={result.editUrl} slotCount={result.slotCount} />
      : <SubmitSuccessAuthed name={result.name} slotCount={result.slotCount} />;
  }

  const event = eventState.event;
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
        selectedSlotIds: [...state.selectedSlotIds],
        ...editArgs,
      });

      if (data.rawToken) {
        // 신규 익명 제출 — 서버가 새 토큰 발급
        const url = `${window.location.origin}/e/${eventId}?rid=${data.responseId}&t=${data.rawToken}`;
        setResult({ kind: "anon", editUrl: url, name: state.name.trim(), slotCount: state.selectedSlotIds.size });
      } else if (user) {
        // 로그인 제출 (신규 또는 수정) — 토큰 개념 없음
        setResult({ kind: "authed", name: state.name.trim(), slotCount: state.selectedSlotIds.size });
      } else if (rid && token) {
        // 익명 편집 — 기존 rid/token 재사용해 동일 편집 URL 유지
        const url = `${window.location.origin}/e/${eventId}?rid=${rid}&t=${token}`;
        setResult({ kind: "anon", editUrl: url, name: state.name.trim(), slotCount: state.selectedSlotIds.size });
      } else {
        // 이 분기는 원칙적으로 도달 불가 (익명 + 신규인데 rawToken 없음은 서버 응답 계약 위반).
        setResult({ kind: "authed", name: state.name.trim(), slotCount: state.selectedSlotIds.size });
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "저장 실패");
      setSubmitting(false);
    }
  };

  const commonProps = {
    event,
    grid,
    state,
    onNameChange: setName,
    onPhoneChange: setPhone,
    onSetSlot: setSlotChecked,
    viewerTz: VIEWER_TZ,
    canSubmit,
    submitting,
    onSubmit: handleSubmit,
    submitError,
  };

  return isDesktop ? <RespondDesktop {...commonProps} /> : <RespondMobile {...commonProps} />;
}
