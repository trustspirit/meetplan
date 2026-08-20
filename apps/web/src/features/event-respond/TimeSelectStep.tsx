import { format, parseISO } from "date-fns";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { DateSelection } from "./selectionModel";
import type { CellGridModel } from "./slotsToCells";

interface Props {
  grid: CellGridModel;
  selections: DateSelection[];
  /** Step 1에서 고른 날짜들. 이 순서대로 섹션이 쌓인다. */
  dates: string[];
  selectedSlotIds: Set<string>;
  onSetSlot: (slotId: string, on: boolean) => void;
}

export function TimeSelectStep({ grid, selections, dates, selectedSlotIds, onSetSlot }: Props) {
  const byDate = new Map(selections.map((s) => [s.dateYmd, s]));

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-text-muted">{t('respond.stepTimes')}</p>

      {dates.map((dateYmd) => {
        const summary = byDate.get(dateYmd);
        const times = grid.times.filter((hhmm) => grid.availableCells.has(`${dateYmd}_${hhmm}`));
        const d = parseISO(dateYmd);

        return (
          <section key={dateYmd} id={`date-section-${dateYmd}`} className="flex flex-col gap-2">
            <div className="sticky top-14 z-10 -mx-4 flex items-baseline justify-between gap-2 border-b border-border bg-bg px-4 py-2">
              <h2 className="text-sm font-semibold text-text">
                {format(d, "M/d")} ({format(d, "EEE")})
              </h2>
              <span className="text-2xs text-text-muted tabular-nums">
                {summary?.selectedTimes.length ?? 0}/{summary?.totalSlots ?? 0}
              </span>
            </div>

            <ul className="overflow-hidden rounded-lg border border-border bg-surface">
              {times.map((hhmm, i) => {
                const slotId = grid.slotIdByCell.get(`${dateYmd}_${hhmm}`);
                if (!slotId) return null;
                const checked = selectedSlotIds.has(slotId);
                return (
                  <li key={hhmm}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={`${format(d, "M/d")} ${hhmm}`}
                      onClick={() => onSetSlot(slotId, !checked)}
                      className={cn(
                        "flex min-h-touch w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        i > 0 && "border-t border-border",
                        checked ? "bg-primary-subtle" : "bg-surface hover:bg-surface-subtle"
                      )}
                    >
                      <span className={cn(
                        "text-base tabular-nums",
                        checked ? "font-semibold text-primary" : "text-text"
                      )}>
                        {hhmm}
                      </span>
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors",
                          checked ? "bg-primary text-primary-foreground" : "border-2 border-border-strong"
                        )}
                        aria-hidden
                      >
                        {checked && <Check size={14} strokeWidth={3} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
