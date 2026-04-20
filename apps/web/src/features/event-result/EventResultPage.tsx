import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { useEventData } from "@/features/event-respond/useEventData";
import { findMatchings } from "@meetplan/shared";
import { useResponses } from "./useResponses";
import { buildMatrixModel } from "./matrixModel";
import { ResponseMatrix } from "./ResponseMatrix";
import { MatchingView } from "./MatchingView";
import { ShareLinkButton } from "./ShareLinkButton";
import { DeleteEventButton } from "./DeleteEventButton";
import { cn } from "@/lib/utils";

const VIEWER_TZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";

type Tab = "matrix" | "matching";

export default function EventResultPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, loading: authLoading } = useAuth();
  const eventState = useEventData(eventId);
  const event = eventState.event;

  // Ownership gate: non-owner subscription to responses would error with permission-denied.
  // Only subscribe once we confirm the user owns the event.
  const isOwner = !!event && !!user && event.ownerUid === user.uid;
  const responsesState = useResponses(isOwner ? eventId : undefined);

  // All hooks must run before any early return (Rules of Hooks).
  // Fallbacks for null event handle the pre-load state.
  const matrixModel = useMemo(
    () => event ? buildMatrixModel(event, responsesState.responses, VIEWER_TZ)
               : { slotColumns: [], rows: [], slotCounts: {} },
    [event, responsesState.responses]
  );

  const matching = useMemo(() => {
    if (!event) {
      return { maxSize: 0, totalParticipants: 0, matchings: [], truncated: false };
    }
    const participants = responsesState.responses.map((r) => ({
      id: r.id,
      availableSlotIds: r.selectedSlotIds,
    }));
    const slotIds = event.slots.map((s) => s.id);
    return findMatchings({ participants, slotIds });
  }, [event, responsesState.responses]);

  const participantNameById = useMemo(
    () => Object.fromEntries(responsesState.responses.map((r) => [r.id, r.name])),
    [responsesState.responses]
  );

  const [tab, setTab] = useState<Tab>("matrix");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const toggleStatus = async () => {
    if (!eventId || !event) return;
    setStatusError(null);
    setStatusUpdating(true);
    try {
      const next = event.status === "open" ? "closed" : "open";
      await updateDoc(doc(db, "events", eventId), {
        status: next,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : "상태 변경 실패");
    } finally {
      setStatusUpdating(false);
    }
  };

  // ---- Early returns (all after hooks) ----
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

  const isClosed = event.status === "closed";
  const closedBadge = isClosed
    ? "bg-zinc-200 text-zinc-600"
    : "bg-emerald-100 text-emerald-800";

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <header className="flex items-start justify-between pb-5 border-b gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:underline">
            ← 대시보드
          </Link>
          <h1 className="text-xl font-semibold mt-1 flex items-center gap-3">
            {event.title}
            <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", closedBadge)}>
              {isClosed ? "마감됨" : "진행 중"}
            </span>
          </h1>
          <div className="text-xs text-muted-foreground mt-1">
            {event.periodMinutes}분 미팅 · 응답 {responsesState.responses.length}명 · 슬롯 {event.slots.length}개
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ShareLinkButton eventId={eventId} />
          <Link to={`/events/${eventId}/edit`}>
            <Button variant="outline" size="sm">편집</Button>
          </Link>
          <Button
            variant={isClosed ? "default" : "outline"}
            size="sm"
            onClick={toggleStatus}
            disabled={statusUpdating}
          >
            {statusUpdating ? "…" : isClosed ? "다시 열기" : "마감"}
          </Button>
          <DeleteEventButton
            eventId={eventId}
            eventTitle={event.title}
            responseCount={responsesState.responses.length}
          />
        </div>
      </header>

      {statusError && (
        <div className="mt-3 text-sm text-destructive">{statusError}</div>
      )}

      <div className="mt-6 flex gap-1 border-b">
        <TabButton active={tab === "matrix"} onClick={() => setTab("matrix")}>
          가용성 매트릭스
        </TabButton>
        <TabButton active={tab === "matching"} onClick={() => setTab("matching")}>
          자동 배정 제안
        </TabButton>
      </div>

      <div className="py-6">
        {responsesState.loading ? (
          <div className="text-center text-sm text-muted-foreground py-10">응답 불러오는 중…</div>
        ) : tab === "matrix" ? (
          <ResponseMatrix model={matrixModel} totalResponses={responsesState.responses.length} />
        ) : (
          <MatchingView
            matching={matching}
            model={matrixModel}
            participantNameById={participantNameById}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm",
        active ? "border-b-2 border-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
