import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hostAddResponseCallable } from "@/lib/callable";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { SlotColumn } from "./matrixModel";

interface Props {
  eventId: string;
  slotColumns: SlotColumn[];
  onClose: () => void;
}

/** 호스트가 응답하지 않은 참가자의 이름과 가능한 슬롯을 직접 입력한다. */
export function AddManualResponseDialog({ eventId, slotColumns, onClose }: Props) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // 날짜별로 묶고 시간순 정렬 ("yyyy-MM-dd HH:mm"은 사전순 = 시간순)
  const days = useMemo(() => {
    const sorted = [...slotColumns].sort((a, b) =>
      `${a.dateYmd} ${a.timeLabel}`.localeCompare(`${b.dateYmd} ${b.timeLabel}`)
    );
    const groups: { dateYmd: string; dateLabel: string; slots: SlotColumn[] }[] = [];
    for (const col of sorted) {
      const last = groups[groups.length - 1];
      if (last && last.dateYmd === col.dateYmd) last.slots.push(col);
      else groups.push({ dateYmd: col.dateYmd, dateLabel: col.dateLabel, slots: [col] });
    }
    return groups;
  }, [slotColumns]);

  const toggle = (slotId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(slotId) ? next.delete(slotId) : next.add(slotId);
      return next;
    });

  const handleClose = () => {
    if (!submitting) onClose();
  };

  const canSubmit = name.trim().length > 0 && selected.size > 0 && !submitting;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await hostAddResponseCallable({
        eventId,
        name: name.trim(),
        selectedSlotIds: [...selected],
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("manual.failed"));
      setSubmitting(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      handleClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-dialog-title"
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-text/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <form
        onSubmit={onSubmit}
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl border border-border bg-surface shadow-md"
      >
        <div className="border-b border-border p-5">
          <h2 id="manual-dialog-title" className="text-base font-semibold">
            {t("manual.title")}
          </h2>
          <p className="mt-1 text-xs text-text-muted">{t("manual.hint")}</p>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-name">{t("manual.nameLabel")}</Label>
            <Input
              id="manual-name"
              ref={nameRef}
              value={name}
              maxLength={40}
              placeholder={t("manual.namePlaceholder")}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text">{t("manual.slotsLabel")}</span>
              <span className="text-xs text-text-muted">
                {t("manual.selectedCount", { count: selected.size })}
              </span>
            </div>
            {days.map((day) => (
              <div key={day.dateYmd} className="flex flex-col gap-1.5">
                <div className="text-xs font-semibold text-text-muted">{day.dateLabel}</div>
                <div className="flex flex-wrap gap-1.5">
                  {day.slots.map((col) => {
                    const on = selected.has(col.slotId);
                    return (
                      <button
                        key={col.slotId}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(col.slotId)}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-xs tabular-nums transition-colors",
                          on
                            ? "border-primary bg-primary font-semibold text-primary-foreground"
                            : "border-border bg-surface text-text-muted hover:text-text"
                        )}
                      >
                        {col.timeLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" size="sm" disabled={!canSubmit}>
            {submitting ? t("manual.submitting") : t("manual.submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
