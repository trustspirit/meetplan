import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { DateSelection } from "./selectionModel";

interface Props {
  selections: DateSelection[];
  /** 요약 항목을 눌렀을 때 그리드의 해당 셀로 이동시킨다. */
  onPick?: (dateYmd: string, hhmm: string) => void;
  className?: string;
}

export function SelectionSummary({ selections, onPick, className }: Props) {
  const withPicks = selections.filter((s) => s.selectedTimes.length > 0);

  return (
    <Card className={cn("p-4", className)}>
      <h2 className="text-sm font-semibold text-text">{t('respond.summaryTitle')}</h2>

      {withPicks.length === 0 ? (
        <p className="mt-3 text-xs text-text-muted">{t('respond.summaryEmpty')}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {withPicks.map((s) => (
            <li key={s.dateYmd}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-text">
                  {format(parseISO(s.dateYmd), "M/d (EEE)")}
                </span>
                <span className="text-2xs text-text-muted">
                  {t('respond.summaryCount', { count: s.selectedTimes.length })}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {s.selectedTimes.map((hhmm) => (
                  <button
                    key={hhmm}
                    type="button"
                    onClick={onPick ? () => onPick(s.dateYmd, hhmm) : undefined}
                    disabled={!onPick}
                    className={cn(
                      "rounded bg-primary-subtle px-1.5 py-0.5 text-2xs tabular-nums text-primary",
                      onPick && "hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    {hhmm}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
