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
import { Copy, Pencil, CircleSlash, RotateCcw, Trash2, AlertCircle } from "lucide-react";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { PageSkeleton } from "@/components/ui/PageSkeleton";

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
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
    return (
      <>
        <MobileHeader title="로딩 중" onBack={() => navigate("/dashboard")} />
        <div className="sm:hidden"><PageSkeleton variant="detail" /></div>
        <div className="hidden sm:block p-10 text-center text-muted-foreground">불러오는 중…</div>
      </>
    );
  }
  if (eventState.error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 p-8 text-center">
        <AlertCircle size={36} className="text-destructive" />
        <div className="font-semibold">이벤트를 찾을 수 없어요</div>
        <p className="text-sm text-muted-foreground max-w-xs">
          {eventState.error ?? "링크가 잘못되었거나 삭제된 이벤트입니다."}
        </p>
        <Link to="/dashboard" className="mt-2 text-sm text-primary hover:underline">← 대시보드로</Link>
      </div>
    );
  }
  if (!user || event.ownerUid !== user.uid) {
    return <Navigate to="/dashboard" replace />;
  }

  const isClosed = event.status === "closed";

  return (
    <div>
      {/* 모바일 앱바 */}
      <MobileHeader
        title={event.title}
        subtitle={`${event.periodMinutes}분 · 응답 ${responsesState.responses.length}명`}
        onBack={() => navigate("/dashboard")}
        actions={<ShareLinkButton eventId={eventId} compact />}
        menuItems={[
          {
            icon: <Copy size={14} />,
            label: "새 이벤트로 복사",
            onClick: () =>
              navigate("/events/new", {
                state: {
                  sourceTitle: event.title,
                  sourceSlots: event.slots,
                  sourcePeriod: event.periodMinutes,
                },
              }),
          },
          {
            icon: <Pencil size={14} />,
            label: "편집",
            onClick: () => navigate(`/events/${eventId}/edit`),
          },
          {
            icon: isClosed ? <RotateCcw size={14} /> : <CircleSlash size={14} />,
            label: isClosed ? "다시 열기" : "마감",
            onClick: toggleStatus,
            variant: "warning" as const,
          },
          {
            icon: <Trash2 size={14} />,
            label: "삭제",
            onClick: () => setConfirmingDelete(true),
            variant: "danger" as const,
          },
        ]}
      />

      {/* 데스크탑 레이아웃 */}
      <div className="hidden sm:block max-w-5xl mx-auto px-6 py-8">
        <header className="flex items-start justify-between pb-5 border-b gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <Link to="/dashboard" className="text-xs text-muted-foreground hover:underline">
              ← 대시보드
            </Link>
            <h1 className="text-xl font-semibold mt-1 flex items-center gap-3">
              {event.title}
              <StatusDot closed={isClosed} />
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
              <Copy size={13} className="mr-1.5" />새 이벤트로 복사
            </Button>
            <Link to={`/events/${eventId}/edit`}>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-400 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950"
              >
                편집
              </Button>
            </Link>
            <Button
              variant={isClosed ? "default" : "outline"}
              size="sm"
              onClick={toggleStatus}
              disabled={statusUpdating}
              className={!isClosed ? "border-amber-400 text-amber-700 hover:bg-amber-50 dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-950" : ""}
            >
              {statusUpdating ? "…" : isClosed ? "다시 열기" : "마감"}
            </Button>
            <DeleteEventButton eventId={eventId} eventTitle={event.title} responseCount={responsesState.responses.length} />
          </div>
        </header>

        {statusError && <div className="mt-3 text-sm text-destructive">{statusError}</div>}

        <div className="mt-6 flex gap-1 border-b">
          <TabButton active={tab === "matrix"} onClick={() => setTab("matrix")}>가용성 매트릭스</TabButton>
          <TabButton active={tab === "matching"} onClick={() => setTab("matching")}>자동 배정 제안</TabButton>
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
              hiddenIds={hiddenIds}
              onToggleHidden={toggleHidden}
            />
          )}
        </div>
      </div>

      {/* 모바일 레이아웃 */}
      <div className="sm:hidden px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <StatusDot closed={isClosed} />
          {statusError && <span className="text-xs text-destructive">{statusError}</span>}
        </div>
        <div className="flex gap-1 border-b mb-4">
          <TabButton active={tab === "matrix"} onClick={() => setTab("matrix")}>가용성 매트릭스</TabButton>
          <TabButton active={tab === "matching"} onClick={() => setTab("matching")}>자동 배정 제안</TabButton>
        </div>
        {responsesState.loading ? (
          <PageSkeleton variant="detail" />
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
            hiddenIds={hiddenIds}
            onToggleHidden={toggleHidden}
          />
        )}
      </div>

      {/* 삭제 확인 다이얼로그 (모바일 ⋮ 메뉴에서 트리거) */}
      {confirmingDelete && (
        <DeleteEventButton
          eventId={eventId}
          eventTitle={event.title}
          responseCount={responsesState.responses.length}
          autoOpen
          onClose={() => setConfirmingDelete(false)}
        />
      )}
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

function StatusDot({ closed }: { closed: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-xs font-medium",
      closed ? "text-zinc-500" : "text-emerald-600"
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        closed ? "bg-zinc-400" : "bg-emerald-500"
      )} />
      {closed ? "마감됨" : "진행 중"}
    </span>
  );
}
