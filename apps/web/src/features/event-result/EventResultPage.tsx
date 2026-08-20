import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { format, parseISO } from "date-fns";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import type { MenuItem } from "@/components/ui/menu";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { PageSkeleton } from "@/components/ui/PageSkeleton";
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

  const toggleAll = (show: boolean) =>
    setHiddenIds(show ? new Set() : new Set(responsesState.responses.map((r) => r.id)));

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
    return <AppShell><PageSkeleton variant="detail" /></AppShell>;
  }
  if (eventState.error || !event) {
    return (
      <AppShell>
        <EmptyState
          icon={<AlertCircle size={36} className="text-danger" aria-hidden />}
          title={t('result.notFound')}
          description={eventState.error ?? t('result.notFoundHint')}
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
      <AppShell>
        <PageHeader
          title={event.title}
          subtitle={`${stakeName} · ${t('eventType.wardVisit')}`}
          backTo="/dashboard"
          backLabel={t('nav.myEvents')}
          primaryAction={<ShareLinkButton eventId={eventId} />}
          overflowActions={[
            {
              icon: <Trash2 size={14} aria-hidden />,
              label: t('result.delete'),
              onClick: () => setConfirmingDelete(true),
              tone: "danger",
            },
          ]}
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">{t('ward.resultTitle')}</h2>
            {latestResponse && (
              <span className="text-xs text-text-muted">
                {t('ward.respondedBy', { name: latestResponse.name })}
              </span>
            )}
          </div>

          {!latestResponse || wardAssignments.length === 0 ? (
            <Card>
              <EmptyState
                title={t('ward.resultNoResponse')}
                description={t('ward.resultNoResponseHint')}
                action={<ShareLinkButton eventId={eventId} />}
              />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="grid grid-cols-2 border-b border-border bg-surface-subtle">
                <div className="p-3 text-2xs font-semibold text-text-muted">{t('ward.resultColWard')}</div>
                <div className="border-l border-border p-3 text-2xs font-semibold text-text-muted">
                  {t('ward.resultColDate')}
                </div>
              </div>
              {wards.map((ward) => {
                const date = assignmentByWardId[ward.id];
                return (
                  <div
                    key={ward.id}
                    className={cn(
                      "grid grid-cols-2 border-t border-border",
                      date ? "bg-surface" : "bg-surface-subtle/50"
                    )}
                  >
                    <div className="p-3 text-sm font-medium text-text">{ward.name}</div>
                    <div className={cn(
                      "border-l border-border p-3 text-sm",
                      date ? "font-semibold text-text" : "text-text-muted"
                    )}>
                      {date ? (() => {
                        const d = parseISO(date);
                        return `${format(d, "M/d")}(${dayShort(d)})`;
                      })() : t('ward.resultUnassigned')}
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>

        <ParticipantNotes responses={responsesState.responses} />

        {confirmingDelete && (
          <DeleteEventButton
            eventId={eventId}
            eventTitle={event.title}
            responseCount={responsesState.responses.length}
            autoOpen
            onClose={() => setConfirmingDelete(false)}
          />
        )}
      </AppShell>
    );
  }

  const isClosed = event.status === "closed";

  const overflowActions: MenuItem[] = [
    {
      icon: <Copy size={14} aria-hidden />,
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
      icon: <Pencil size={14} aria-hidden />,
      label: t('result.edit'),
      onClick: () => navigate(`/events/${eventId}/edit`),
    },
    {
      icon: isClosed ? <RotateCcw size={14} aria-hidden /> : <CircleSlash size={14} aria-hidden />,
      label: statusUpdating ? "…" : isClosed ? t('result.reopen') : t('result.close'),
      onClick: toggleStatus,
      tone: "warning",
    },
    {
      icon: <Trash2 size={14} aria-hidden />,
      label: t('result.delete'),
      onClick: () => setConfirmingDelete(true),
      tone: "danger",
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title={event.title}
        subtitle={t('result.headerInfo', {
          periodMinutes: event.periodMinutes,
          responses: responsesState.responses.length,
          slots: event.slots.length,
        })}
        badge={
          <Badge tone={isClosed ? "neutral" : "success"} dot>
            {isClosed ? t('result.statusClosed') : t('result.statusOpen')}
          </Badge>
        }
        backTo="/dashboard"
        backLabel={t('nav.myEvents')}
        primaryAction={<ShareLinkButton eventId={eventId} />}
        overflowActions={overflowActions}
      />

      {statusError && <p className="mb-4 text-sm text-danger">{statusError}</p>}

      <Tabs
        items={[
          { value: "matrix", label: t('result.tabMatrix') },
          { value: "matching", label: t('result.tabMatching') },
        ] as const}
        value={tab}
        onChange={setTab}
        className="mb-6"
      />

      {responsesState.loading ? (
        <PageSkeleton variant="detail" />
      ) : tab === "matrix" ? (
        <ResponseMatrix
          model={matrixModel}
          totalResponses={responsesState.responses.length}
          participantColors={participantColors}
          hiddenIds={hiddenIds}
          onToggleHidden={toggleHidden}
          onToggleAll={toggleAll}
        />
      ) : (
        <MatchingView
          matching={matching}
          model={matrixModel}
          participantNameById={participantNameById}
          participantColors={participantColors}
          hiddenIds={hiddenIds}
          onToggleHidden={toggleHidden}
          onToggleAll={toggleAll}
          slots={event.slots}
          eventTitle={event.title}
          eventDescription={event.description}
        />
      )}

      <ParticipantNotes responses={responsesState.responses} />

      {confirmingDelete && (
        <DeleteEventButton
          eventId={eventId}
          eventTitle={event.title}
          responseCount={responsesState.responses.length}
          autoOpen
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </AppShell>
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
          <li key={r.id} className="rounded-lg border border-border bg-surface-subtle/60 px-3 py-2.5 text-sm">
            <span className="mr-2 font-medium text-text-muted">{r.name}</span>
            <span className="whitespace-pre-wrap text-text">{r.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
