import { useMemo, useState } from "react";
import { addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isBefore, isSameMonth, startOfToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface Props {
  selectedDates: string[];
  onToggleDate: (ymd: string) => void;
  sundayOnly?: boolean;
}

export function MultiDateCalendar({ selectedDates, onToggleDate, sundayOnly = false }: Props) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const today = startOfToday();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  return (
    <div className="rounded-xl border p-4 bg-surface">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm">{format(viewMonth, "yyyy년 M월")}</div>
        <div className="flex gap-1">
          <button type="button" onClick={() => setViewMonth((m) => addMonths(m, -1))}
            className="w-7 h-7 rounded border inline-flex items-center justify-center hover:bg-surface-subtle">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="w-7 h-7 rounded border inline-flex items-center justify-center hover:bg-surface-subtle">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {["일","월","화","수","목","금","토"].map((d, i) => (
          <div key={d} className={cn(
            "text-2xs text-center py-1 font-medium",
            sundayOnly && i === 0 ? "text-primary font-bold" : "text-text-muted"
          )}>{d}</div>
        ))}
        {days.map((day) => {
          const ymd = format(day, "yyyy-MM-dd");
          const past = isBefore(day, today);
          const inMonth = isSameMonth(day, viewMonth);
          const isSunday = day.getDay() === 0;
          const disabled = past || (sundayOnly && !isSunday);
          const selected = selectedDates.includes(ymd);
          return (
            <button
              key={ymd}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onToggleDate(ymd)}
              className={cn(
                "aspect-square rounded-md text-xs inline-flex items-center justify-center transition-colors",
                !inMonth && "text-text-muted/40",
                disabled && "text-text-muted/30 cursor-not-allowed",
                !disabled && !selected && "hover:bg-surface-subtle",
                !disabled && sundayOnly && isSunday && !selected && "text-primary font-medium",
                selected && "bg-primary text-primary-foreground font-semibold"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
      {selectedDates.length > 0 && (
        <div className="mt-3 pt-3 border-t text-2xs text-text-muted">
          {t('calendar.selectedDates', { count: selectedDates.length })}
        </div>
      )}
    </div>
  );
}
