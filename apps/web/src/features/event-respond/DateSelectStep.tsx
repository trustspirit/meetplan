import { format, parseISO } from "date-fns";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { DateSelection } from "./selectionModel";
import type { CellGridModel } from "./slotsToCells";

interface Props {
  grid: CellGridModel;
  selections: DateSelection[];
  selectedDates: Set<string>;
  onToggleDate: (dateYmd: string) => void;
}

/** 그 날짜에 호스트가 연 시간대의 처음~끝을 "09:00-12:00" 형태로 만든다. */
function dateRangeLabel(grid: CellGridModel, dateYmd: string): string {
  const times = grid.times.filter((hhmm) => grid.availableCells.has(`${dateYmd}_${hhmm}`));
  if (times.length === 0) return "";
  return `${times[0]}–${times[times.length - 1]}`;
}

export function DateSelectStep({ grid, selections, selectedDates, onToggleDate }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">{t('respond.stepDates')}</p>

      <ul className="flex flex-col gap-2">
        {selections.map((s) => {
          const checked = selectedDates.has(s.dateYmd);
          const d = parseISO(s.dateYmd);
          return (
            <li key={s.dateYmd}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onToggleDate(s.dateYmd)}
                className={cn(
                  "flex min-h-[56px] w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  checked
                    ? "border-primary bg-primary-subtle"
                    : "border-border bg-surface hover:border-border-strong"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors",
                    checked ? "border-primary bg-primary text-primary-foreground" : "border-border-strong bg-surface"
                  )}
                  aria-hidden
                >
                  {checked && <Check size={14} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium text-text">
                    {format(d, "M/d")} ({format(d, "EEE")})
                  </span>
                  <span className="mt-0.5 block text-2xs text-text-muted">
                    {t('respond.dateSlotInfo', {
                      range: dateRangeLabel(grid, s.dateYmd),
                      count: s.totalSlots,
                    })}
                  </span>
                </span>
                {s.selectedTimes.length > 0 && (
                  <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-2xs font-medium text-primary-foreground">
                    {s.selectedTimes.length}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
