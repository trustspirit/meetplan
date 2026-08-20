import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { format, parseISO } from "date-fns";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { useEventData } from "@/features/event-respond/useEventData";
import { findMatchings, getWardsByStake, getStakeName } from "@meetplan/shared";
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
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { t, getLocale } from "@/lib/i18n";

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

  const isOwner = !!event && !!user && event.ownerUid === user.uid;
  const responsesState = useResponses(isOwner ? eventId : undefined);

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
      setStatusError(e instanceof Error ? e.message : t('result.statusChangeFailed'));
    } finally {
      setStatusUpdating(false);
    }
  };

  if (!eventId) return <Navigate to="/dashboard" replace />;
  if (authLoading || eventState.loading) {
    return (
      <>
        <MobileHeader title={t('result.loading')} onBack={() => navigate("/dashboard")} />
        <div className="sm:hidden"><PageSkeleton variant="detail" /></div>
        <div className="hidden sm:block p-10 text-center text-muted-foreground">{t('common.loading')}</div>
      </>
    );
  }
  if (eventState.error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 p-8 text-center">
        <AlertCircle size={36} className="text-destructive" />
        <div className="font-semibold">{t('result.notFound')}</div>
        <p className="text-sm text-muted-foreground max-w-xs">
          {eventState.error ?? t('result.notFoundHint')}
        </p>
        <Link to="/dashboard" className="mt-2 text-sm text-primary hover:underline">
          {t('common.backToDashboard')}
        </Link>
      </div>
    );
  }
  if (!user || event.ownerUid !== user.uid) {
    return <Navigate to="/dashboard" replace />;
  }

  // Ward visit events: show assignment result instead of matrix
  if (event.eventType === "ward_visit") {
    const wards = getWardsByStake(event.stakeId ?? "");
    const stakeName = getStakeName(event.stakeId ?? "");
    const latestResponse = responsesState.responses[responsesState.responses.length - 1];
    const wardAssignments = latestResponse?.wardAssignments ?? [];
    const assignmentByWardId = Object.fromEntries(wardAssignments.map((a) => [a.wardId, a.date]));
    const dayShort = (d: Date) =>
      new Intl.DateTimeFormat(getLocale() === 'ko' ? 'ko-KR' : 'en-US', { weekday: 'short' }).format(d);

    return (
      <div>
        <MobileHeader
          title={event.title}
          subtitle={stakeName}
          onBack={() => navigate("/dashboard")}
          actions={<ShareLinkButton eventId={eventId} compact />}
          menuItems={[
            {
              icon: <Trash2 size={14} />,
              label: t('result.delete'),
              onClick: () => setConfirmingDelete(true),
              variant: "danger" as const,
            },
          ]}
        />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
          <div className="hidden sm:flex items-center justify-between pb-4 border-b">
            <div>
              <Link to="/dashboard" className="text-xs text-muted-foreground hover:underline">
                {t('common.backToDashboardShort')}
              </Link>
              <h1 className="text-xl font-semibold mt-1">{event.title}</h1>
              <div className="text-sm text-muted-foreground mt-0.5">{stakeName} · {t('eventType.wardVisit')}</div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ShareLinkButton eventId={eventId} />
              <DeleteEventButton eventId={eventId} eventTitle={event.title} responseCount={responsesState.responses.length} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">{t('ward.resultTitle')}</h2>
              {latestResponse && (
                <span className="text-xs text-muted-foreground">
                  {t('ward.respondedBy', { name: latestResponse.name })}
                </span>
              )}
            </div>

            {!latestResponse || wardAssignments.length === 0 ? (
              <div className="rounded-xl border p-6 text-center flex flex-col gap-2">
                <p className="font-medium text-sm">{t('ward.resultNoResponse')}</p>
                <p className="text-xs text-muted-foreground">{t('ward.resultNoResponseHint')}</p>
                <div className="mt-2">
                  <ShareLinkButton eventId={eventId} />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden">
                <div className="grid grid-cols-2 bg-muted/50 border-b">
                  <div className="p-3 text-xs font-semibold text-muted-foreground">{t('ward.resultColWard')}</div>
                  <div className="p-3 text-xs font-semibold text-muted-foreground border-l">{t('ward.resultColDate')}</div>
                </div>
                {wards.map((ward, i) => {
                  const date = assignmentByWardId[ward.id];
                  return (
                    <div
                      key={ward.id}
                      className={cn(
                        "grid grid-cols-2 border-t",
                        date ? "bg-background" : "bg-muted/10"
                      )}
                    >
                      <div className="p-3 text-sm font-medium">{ward.name}</div>
                      <div className={cn(
                        "p-3 text-sm border-l",
                        date ? "text-foreground font-semibold" : "text-muted-foreground"
                      )}>
                        {date ? (() => {
                          const d = parseISO(date);
                          return `${format(d, "M/d")}(${dayShort(d)})`;
                        })() : t('ward.resultUnassigned')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <ParticipantNotes responses={responsesState.responses} />
        </div>

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

  const isClosed = event.status === "closed";

  return (
    <div>
      <MobileHeader
        title={event.title}
        subtitle={t('result.subtitle', { periodMinutes: event.periodMinutes, count: responsesState.responses.length })}
        onBack={() => navigate("/dashboard")}
        actions={<ShareLinkButton eventId={eventId} compact />}
        menuItems={[
          {
            icon: <Copy size={14} />,
            label: t('result.copyEvent'),
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
            label: t('result.edit'),
            onClick: () => navigate(`/events/${eventId}/edit`),
          },
          {
            icon: isClosed ? <RotateCcw size={14} /> : <CircleSlash size={14} />,
            label: isClosed ? t('result.reopen') : t('result.close'),
            onClick: toggleStatus,
            variant: "warning" as const,
          },
          {
            icon: <Trash2 size={14} />,
            label: t('result.delete'),
            onClick: () => setConfirmingDelete(true),
            variant: "danger" as const,
          },
        ]}
      />

      <div className="hidden sm:block max-w-5xl mx-auto px-6 py-8">
        <header className="flex items-start justify-between pb-5 border-b gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <Link to="/dashboard" className="text-xs text-muted-foreground hover:underline">
              {t('common.backToDashboardShort')}
            </Link>
            <h1 className="text-xl font-semibold mt-1 flex items-center gap-3">
              {event.title}
              <StatusDot closed={isClosed} />
            </h1>
            <div className="text-xs text-muted-foreground mt-1">
              {t('result.headerInfo', {
                periodMinutes: event.periodMinutes,
                responses: responsesState.responses.length,
                slots: event.slots.length,
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <LanguageToggle />
            <ShareLinkButton eventId={eventId} />
            <Button
              variant="secondary"
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
              title={t('result.copyTitle')}
            >
              <Copy size={13} className="mr-1.5" />{t('result.copyEvent')}
            </Button>
            <Link to={`/events/${eventId}/edit`}>
              <Button
                variant="secondary"
                size="sm"
                className="border-blue-400 text-blue-600 hover:bg-blue-50"
              >
                {t('result.edit')}
              </Button>
            </Link>
            <Button
              variant={isClosed ? "primary" : "secondary"}
              size="sm"
              onClick={toggleStatus}
              disabled={statusUpdating}
              className={!isClosed ? "border-amber-400 text-amber-700 hover:bg-amber-50" : ""}
            >
              {statusUpdating ? "…" : isClosed ? t('result.reopen') : t('result.close')}
            </Button>
            <DeleteEventButton eventId={eventId} eventTitle={event.title} responseCount={responsesState.responses.length} />
          </div>
        </header>

        {statusError && <div className="mt-3 text-sm text-destructive">{statusError}</div>}

        <div className="mt-6 flex gap-1 border-b">
          <TabButton active={tab === "matrix"} onClick={() => setTab("matrix")}>{t('result.tabMatrix')}</TabButton>
          <TabButton active={tab === "matching"} onClick={() => setTab("matching")}>{t('result.tabMatching')}</TabButton>
        </div>

        <div className="py-6">
          {responsesState.loading ? (
            <div className="text-center text-sm text-muted-foreground py-10">{t('result.loadingResponses')}</div>
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
              slots={event.slots}
              eventTitle={event.title}
              eventDescription={event.description}
            />
          )}
          <ParticipantNotes responses={responsesState.responses} />
        </div>
      </div>

      <div className="sm:hidden px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <StatusDot closed={isClosed} />
          {statusError && <span className="text-xs text-destructive">{statusError}</span>}
        </div>
        <div className="flex gap-1 border-b mb-4">
          <TabButton active={tab === "matrix"} onClick={() => setTab("matrix")}>{t('result.tabMatrix')}</TabButton>
          <TabButton active={tab === "matching"} onClick={() => setTab("matching")}>{t('result.tabMatching')}</TabButton>
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
            slots={event.slots}
            eventTitle={event.title}
            eventDescription={event.description}
          />
        )}
        <ParticipantNotes responses={responsesState.responses} />
      </div>

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

function ParticipantNotes({ responses }: { responses: import("@meetplan/shared").ParticipantResponse[] }) {
  const withNotes = responses.filter((r) => r.note);
  if (withNotes.length === 0) return null;
  return (
    <div className="mt-6 flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{t('result.participantNotes')}</h3>
      <ul className="flex flex-col gap-2">
        {withNotes.map((r) => (
          <li key={r.id} className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
            <span className="font-medium text-foreground/70 mr-2">{r.name}</span>
            <span className="whitespace-pre-wrap">{r.note}</span>
          </li>
        ))}
      </ul>
    </div>
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
      {closed ? t('result.statusClosed') : t('result.statusOpen')}
    </span>
  );
}
