import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileHeader } from "@/components/ui/MobileHeader";
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
        selectedSlotIds: [],
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
        <CheckCircle2 size={48} className="text-green-500" />
        <div className="font-semibold text-lg">{t('ward.successTitle', { name: result.name })}</div>
        <p className="text-sm text-muted-foreground">
          {t('ward.successDesc', { stake: stakeName })}
        </p>
        {result.kind === "anon" && (
          <div className="mt-2 p-4 rounded-xl border bg-muted/50 text-left max-w-sm w-full">
            <p className="text-xs text-muted-foreground mb-1">{t('ward.saveEditLink')}</p>
            <p className="text-xs font-mono break-all text-foreground">{result.editUrl}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Mobile header */}
      <MobileHeader
        title={event.title}
        subtitle={stakeName}
        onBack={() => window.history.back()}
      />

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6 pb-32 sm:pb-6">
        {/* Respondent info */}
        <section className="flex flex-col gap-4">
          <div>
            <Label htmlFor="wv-name">{t('form.nameLabel')}</Label>
            <Input
              id="wv-name"
              className="mt-2"
              placeholder={t('form.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="wv-phone">{t('form.phoneLabel')}</Label>
            <Input
              id="wv-phone"
              className="mt-2"
              placeholder={t('form.phonePlaceholder')}
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(formatKoreanPhone(e.target.value))}
            />
            {phone && !phoneOk && (
              <p className="mt-1 text-xs text-destructive">{t('form.phoneError')}</p>
            )}
          </div>
        </section>

        {/* Ward assigner */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">{t('ward.assignHint')}</p>
            <span className="text-xs text-muted-foreground">
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
                    assigned ? "border-primary/30 bg-primary/5" : "bg-background"
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
                  <div className="flex gap-2 overflow-x-auto pb-1">
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
                            "flex-none flex flex-col items-center px-3 py-2 rounded-lg text-xs min-w-[52px] transition-colors",
                            isSelected && "bg-primary text-primary-foreground",
                            !isSelected && otherWard && "bg-amber-50 border border-amber-200 text-amber-700",
                            !isSelected && !otherWard && "bg-muted hover:bg-muted/70"
                          )}
                          title={otherWard ? t('ward.dateOccupied', { name: otherWard.name }) : undefined}
                        >
                          <span className="opacity-70 mb-0.5">{dayShort(dj)}</span>
                          <span className="font-semibold">{format(dj, "M/d")}</span>
                          {otherWard && !isSelected && <span className="text-[9px] opacity-70 mt-0.5">!</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
              <AlertTriangle size={16} />
              {t('ward.conflictTitle')}
            </div>
            <ul className="flex flex-col gap-1.5">
              {warnings.map((w, i) => (
                <li key={i} className="text-sm">
                  <span className={cn(
                    "font-medium",
                    w.type === "conflict" ? "text-destructive" : "text-amber-700"
                  )}>{w.label}</span>
                  <span className="text-muted-foreground ml-2">{w.detail}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-amber-800">{t('ward.confirmAnyway')}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setWarnings([]); setPendingAssignments(null); }}>
                ← {t('ward.backToEdit')}
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? t('ward.saving') : t('ward.confirmAndSubmit')}
              </Button>
            </div>
          </div>
        )}

        {submitError && (
          <p className="text-sm text-destructive text-center">{submitError}</p>
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
        <div className="sm:hidden fixed left-0 right-0 bottom-0 bg-background border-t px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
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
    <div className="rounded-xl border overflow-hidden">
      {/* Header row */}
      <div
        className="grid bg-muted/50"
        style={{ gridTemplateColumns: `1fr repeat(${dates.length}, minmax(80px, 1fr))` }}
      >
        <div className="p-3 text-xs font-semibold text-muted-foreground">{t('ward.resultColWard')}</div>
        {dates.map((date) => {
          const d = parseISO(date);
          return (
            <div key={date} className="p-3 text-center border-l">
              <div className="text-xs text-muted-foreground">{format(d, "M월")}</div>
              <div className="text-sm font-semibold">{format(d, "d일")}</div>
              <div className="text-[10px] text-muted-foreground">({dayShort(d)})</div>
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
              "grid border-t transition-colors",
              assigned ? "bg-primary/5" : i % 2 === 0 ? "bg-background" : "bg-muted/20"
            )}
            style={{ gridTemplateColumns: `1fr repeat(${dates.length}, minmax(80px, 1fr))` }}
          >
            <div className="p-3 flex items-center gap-2">
              <span className="text-sm font-medium">{ward.name}</span>
              {assigned && (
                <span className="text-[10px] text-primary font-semibold">✓</span>
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
                    !isSelected && otherWard && "bg-amber-50 hover:bg-amber-100",
                    !isSelected && !otherWard && "hover:bg-muted/60"
                  )}
                  title={otherWard ? t('ward.dateOccupied', { name: otherWard.name }) : undefined}
                >
                  {isSelected ? (
                    <CheckCircle2 size={18} />
                  ) : otherWard ? (
                    <span className="text-amber-500 text-xs font-bold">!</span>
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
