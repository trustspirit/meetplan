import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
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

const PARTICIPANT_COLORS = [
  "#f43f5e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
];

type Tab = "matrix" | "matching";

export default function EventResultPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
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
               : { slotColumns: [], rows: [], slotCounts: {}, dateGroups: [], timeGroups: [], groupedCells: {} },
    [event, responsesState.responses]
  );

  const participantColors = useMemo(
    () => Object.fromEntries(
      responsesState.responses.map((r, i) => [r.id, PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length]!])
    ),
    [responsesState.responses]
  );

  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const toggleHidden = (id: string) =>
    setHiddenIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const visibleResponses = useMemo(
    () => responsesState.responses.filter((r) => !hiddenIds.has(r.id)),
    [responsesState.responses, hiddenIds]
  );

  const matching = useMemo(() => {
    const empty = { maxSize: 0, totalParticipants: 0, matchings: [], truncated: false };
    if (!event) return empty;
    try {
      const participants = visibleResponses.map((r) => ({
        id: r.id,
        availableSlotIds: r.selectedSlotIds,
      }));
      const slotIds = event.slots.map((s) => s.id);
      return findMatchings({ participants, slotIds });
    } catch (e) {
      console.error("findMatchings failed:", e);
      return empty;
    }
  }, [event, visibleResponses]);

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
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate("/events/new", {
                state: {
                  sourceTitle: event.title,
                  sourceSlots: event.slots,
                  sourcePeriod: event.periodMinutes,
                },
              })
            }
            title="이 이벤트의 시간대를 그대로 가져와 새 이벤트 생성"
          >
            📋 새 이벤트로 복사
          </Button>
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
          <ResponseMatrix
            model={matrixModel}
            totalResponses={responsesState.responses.length}
            participantColors={participantColors}
            hiddenIds={hiddenIds}
            onToggleHidden={toggleHidden}
          />
        ) : (
          <MatchingView
            matching={matching}
            model={matrixModel}
            participantNameById={participantNameById}
            participantColors={participantColors}
            hiddenCount={hiddenIds.size}
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
