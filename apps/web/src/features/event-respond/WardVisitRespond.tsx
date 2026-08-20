import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { t, getLocale } from "@/lib/i18n";
import { phoneRegex, normalizePhone, getWardsByStake, getStakeName } from "@meetplan/shared";
import { formatKoreanPhone } from "@meetplan/shared";
import { submitResponseCallable } from "@/lib/callable";
import type { MeetplanEvent } from "@meetplan/shared";
import type { User } from "firebase/auth";

interface Props {
  event: MeetplanEvent;
  eventId: string;
  user: User | null;
  rid?: string | null;
  token?: string | null;
}

interface Warning {
  type: "conflict" | "missing";
  label: string;
  detail: string;
}

type SubmitResult =
  | { kind: "anon"; editUrl: string; name: string }
  | { kind: "authed"; name: string };

function dayShort(date: Date): string {
  const loc = getLocale() === 'ko' ? 'ko-KR' : 'en-US';
  return new Intl.DateTimeFormat(loc, { weekday: 'short' }).format(date);
}

export function WardVisitRespond({ event, eventId, user, rid, token }: Props) {
  const wards = getWardsByStake(event.stakeId ?? "");
  const dates = event.wardVisitDates ?? [];
  const stakeName = getStakeName(event.stakeId ?? "");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    () => Object.fromEntries(wards.map((w) => [w.id, null]))
  );
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<{ wardId: string; wardName: string; date: string }[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const nameOk = name.trim().length > 0;
  const phoneOk = phoneRegex.test(phone);
  const assignedCount = Object.values(assignments).filter(Boolean).length;

  function assign(wardId: string, date: string) {
    setAssignments((prev) => ({
      ...prev,
      [wardId]: prev[wardId] === date ? null : date,
    }));
    setWarnings([]);
    setPendingAssignments(null);
  }

  function buildResult() {
    return wards
      .filter((w) => assignments[w.id])
      .map((w) => ({ wardId: w.id, wardName: w.name, date: assignments[w.id]! }));
  }

  function detectWarnings(result: { wardId: string; wardName: string; date: string }[]): Warning[] {
    const found: Warning[] = [];

    const dateToWards: Record<string, string[]> = {};
    for (const { wardName, date } of result) {
      if (!dateToWards[date]) dateToWards[date] = [];
      dateToWards[date].push(wardName);
    }
    for (const [date, names] of Object.entries(dateToWards)) {
      if (names.length > 1) {
        found.push({
          type: "conflict",
          label: `${formatDate(date)} — ${t('ward.dateConflict')}`,
          detail: names.join(", "),
        });
      }
    }

    const unassigned = wards.filter((w) => !assignments[w.id]).map((w) => w.name);
    if (unassigned.length > 0) {
      found.push({
        type: "missing",
        label: t('ward.unassignedWarning', { count: unassigned.length }),
        detail: unassigned.join(", "),
      });
    }

    return found;
  }

  async function handleSubmit() {
    const resultData = buildResult();
    const found = detectWarnings(resultData);

    if (found.length > 0 && !pendingAssignments) {
      setWarnings(found);
      setPendingAssignments(resultData);
      return;
    }

    const final = pendingAssignments ?? resultData;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const trimmedNote = note.trim();
      const editArgs =
        rid && token
          ? { rid, token }
          : user
          ? {}
          : {};
      const { data } = await submitResponseCallable({
        eventId,
        name: name.trim(),
        phone: normalizePhone(phone),
        ...(trimmedNote ? { note: trimmedNote } : {}),
        selectedSlotIds: [],
        answers: {},
        wardAssignments: final,
        ...editArgs,
      });

      if (data.rawToken) {
        const url = `${window.location.origin}/e/${eventId}?rid=${data.responseId}&t=${data.rawToken}`;
        setResult({ kind: "anon", editUrl: url, name: name.trim() });
      } else {
        setResult({ kind: "authed", name: name.trim() });
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : t('ward.saveFailed'));
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <CheckCircle2 size={48} className="text-success" />
        <div className="font-semibold text-lg">{t('ward.successTitle', { name: result.name })}</div>
        <p className="text-sm text-text-muted">
          {t('ward.successDesc', { stake: stakeName })}
        </p>
        {result.kind === "anon" && (
          <div className="mt-2 p-4 rounded-xl border bg-surface-subtle text-left max-w-sm w-full">
            <p className="text-xs text-text-muted mb-1">{t('ward.saveEditLink')}</p>
            <p className="text-xs font-mono break-all text-text">{result.editUrl}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={event.title}
        subtitle={stakeName}
        onBack={() => window.history.back()}
        backLabel={t('common.close')}
      />

      <div className="mx-auto flex max-w-2xl flex-col gap-6 pb-32 sm:pb-6">
        {/* Notes from organizer */}
        {event.description && (
          <p className="text-sm text-text whitespace-pre-wrap bg-surface-subtle rounded-lg px-3 py-2.5">{event.description}</p>
        )}

        {/* Respondent info */}
        <section className="flex flex-col gap-5">
          <Field label={t('form.nameLabel')} htmlFor="wv-name">
            <Input
              id="wv-name"
              placeholder={t('form.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field
            label={t('form.phoneLabel')}
            htmlFor="wv-phone"
            {...(phone && !phoneOk ? { error: t('form.phoneError') } : {})}
          >
            <Input
              id="wv-phone"
              placeholder={t('form.phonePlaceholder')}
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(formatKoreanPhone(e.target.value))}
            />
          </Field>

          <Field label={t('form.respondentNote')} htmlFor="wv-note">
            <Textarea
              id="wv-note"
              rows={3}
              maxLength={300}
              placeholder={t('form.respondentNotePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        </section>

        {/* Ward assigner */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">{t('ward.assignHint')}</p>
            <span className="text-xs text-text-muted">
              {t('ward.assignedCount', { count: assignedCount })} / {t('ward.totalCount', { count: wards.length })}
            </span>
          </div>

          {/* Desktop grid view */}
          <div className="hidden sm:block">
            <DesktopGrid
              wards={wards}
              dates={dates}
              assignments={assignments}
              onAssign={assign}
            />
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden flex flex-col gap-2">
            {wards.map((ward) => {
              const assigned = assignments[ward.id];
              return (
                <div
                  key={ward.id}
                  className={cn(
                    "rounded-xl border p-3 transition-colors",
                    assigned ? "border-primary/30 bg-primary/5" : "bg-surface"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{ward.name}</span>
                    {assigned && (
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {formatDate(assigned)}
                      </span>
                    )}
                  </div>
                  <ScrollArea contentClassName="flex gap-2 pb-1">
                    {dates.map((date) => {
                      const isSelected = assigned === date;
                      const dj = parseISO(date);
                      const otherWard = wards.find(
                        (w) => w.id !== ward.id && assignments[w.id] === date
                      );
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => assign(ward.id, date)}
                          className={cn(
                            "flex min-h-touch min-w-[52px] flex-none flex-col items-center justify-center rounded-lg px-3 py-2 text-xs transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isSelected && "bg-primary text-primary-foreground",
                            !isSelected && otherWard && "border border-warning/30 bg-warning/10 text-warning",
                            !isSelected && !otherWard && "bg-surface-subtle hover:bg-border-strong/40"
                          )}
                          title={otherWard ? t('ward.dateOccupied', { name: otherWard.name }) : undefined}
                        >
                          <span className="opacity-70 mb-0.5">{dayShort(dj)}</span>
                          <span className="font-semibold">{format(dj, "M/d")}</span>
                          {otherWard && !isSelected && <span className="text-2xs opacity-70 mt-0.5">!</span>}
                        </button>
                      );
                    })}
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        </section>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-warning font-semibold text-sm">
              <AlertTriangle size={16} />
              {t('ward.conflictTitle')}
            </div>
            <ul className="flex flex-col gap-1.5">
              {warnings.map((w, i) => (
                <li key={i} className="text-sm">
                  <span className={cn(
                    "font-medium",
                    w.type === "conflict" ? "text-danger" : "text-warning"
                  )}>{w.label}</span>
                  <span className="text-text-muted ml-2">{w.detail}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-warning">{t('ward.confirmAnyway')}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setWarnings([]); setPendingAssignments(null); }}>
                ← {t('ward.backToEdit')}
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? t('ward.saving') : t('ward.confirmAndSubmit')}
              </Button>
            </div>
          </div>
        )}

        {submitError && (
          <p className="text-sm text-danger text-center">{submitError}</p>
        )}

        {/* Desktop submit */}
        {warnings.length === 0 && (
          <div className="hidden sm:flex justify-end">
            <Button
              size="lg"
              disabled={!nameOk || !phoneOk || assignedCount === 0 || submitting}
              onClick={handleSubmit}
            >
              {submitting ? t('ward.saving') : t('ward.submitAssignment')}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile fixed bottom bar */}
      {warnings.length === 0 && (
        <div className="sm:hidden fixed left-0 right-0 bottom-0 bg-surface border-t px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-xs text-text-muted">
            {assignedCount > 0
              ? t('ward.assignedCount', { count: assignedCount })
              : t('ward.assignHint')}
          </div>
          <Button
            size="lg"
            disabled={!nameOk || !phoneOk || assignedCount === 0 || submitting}
            onClick={handleSubmit}
          >
            {submitting ? t('ward.saving') : t('ward.submitAssignment')}
          </Button>
        </div>
      )}
    </>
  );
}

function formatDate(ymd: string): string {
  try {
    const d = parseISO(ymd);
    return `${format(d, "M/d")}(${dayShort(d)})`;
  } catch {
    return ymd;
  }
}

interface GridProps {
  wards: ReturnType<typeof getWardsByStake>;
  dates: string[];
  assignments: Record<string, string | null>;
  onAssign: (wardId: string, date: string) => void;
}

function DesktopGrid({ wards, dates, assignments, onAssign }: GridProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Header row */}
      <div
        className="grid bg-surface-subtle"
        style={{ gridTemplateColumns: `1fr repeat(${dates.length}, minmax(80px, 1fr))` }}
      >
        <div className="p-3 text-xs font-semibold text-text-muted">{t('ward.resultColWard')}</div>
        {dates.map((date) => {
          const d = parseISO(date);
          return (
            <div key={date} className="p-3 text-center border-l border-border">
              <div className="text-xs text-text-muted">{format(d, "M월")}</div>
              <div className="text-sm font-semibold">{format(d, "d일")}</div>
              <div className="text-2xs text-text-muted">({dayShort(d)})</div>
            </div>
          );
        })}
      </div>

      {/* Ward rows */}
      {wards.map((ward, i) => {
        const assigned = assignments[ward.id];
        return (
          <div
            key={ward.id}
            className={cn(
              "grid border-t border-border transition-colors",
              assigned ? "bg-primary/5" : i % 2 === 0 ? "bg-surface" : "bg-surface-subtle/60"
            )}
            style={{ gridTemplateColumns: `1fr repeat(${dates.length}, minmax(80px, 1fr))` }}
          >
            <div className="p-3 flex items-center gap-2">
              <span className="text-sm font-medium">{ward.name}</span>
              {assigned && (
                <span className="text-2xs text-primary font-semibold">✓</span>
              )}
            </div>
            {dates.map((date) => {
              const isSelected = assigned === date;
              const otherWard = wards.find(
                (w) => w.id !== ward.id && assignments[w.id] === date
              );
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => onAssign(ward.id, date)}
                  className={cn(
                    "border-l h-full min-h-[48px] flex items-center justify-center transition-colors",
                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && otherWard && "bg-warning/10 hover:bg-warning/20",
                    !isSelected && !otherWard && "hover:bg-surface-subtle/60"
                  )}
                  title={otherWard ? t('ward.dateOccupied', { name: otherWard.name }) : undefined}
                >
                  {isSelected ? (
                    <CheckCircle2 size={18} />
                  ) : otherWard ? (
                    <span className="text-xs font-bold text-warning">!</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
