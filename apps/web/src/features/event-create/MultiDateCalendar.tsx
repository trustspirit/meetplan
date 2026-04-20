import { useMemo, useState } from "react";
import { addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isBefore, isSameMonth, startOfToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  selectedDates: string[];
  onToggleDate: (ymd: string) => void;
}

export function MultiDateCalendar({ selectedDates, onToggleDate }: Props) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const today = startOfToday();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  return (
    <div className="rounded-xl border p-4 bg-background">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm">{format(viewMonth, "yyyy년 M월")}</div>
        <div className="flex gap-1">
          <button type="button" onClick={() => setViewMonth((m) => addMonths(m, -1))}
            className="w-7 h-7 rounded border inline-flex items-center justify-center hover:bg-muted">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="w-7 h-7 rounded border inline-flex items-center justify-center hover:bg-muted">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {["일","월","화","수","목","금","토"].map((d) => (
          <div key={d} className="text-[10px] text-muted-foreground text-center py-1 font-medium">{d}</div>
        ))}
        {days.map((day) => {
          const ymd = format(day, "yyyy-MM-dd");
          const past = isBefore(day, today);
          const inMonth = isSameMonth(day, viewMonth);
          const selected = selectedDates.includes(ymd);
          return (
            <button
              key={ymd}
              type="button"
              disabled={past}
              onClick={() => onToggleDate(ymd)}
              className={cn(
                "aspect-square rounded-md text-xs inline-flex items-center justify-center transition-colors",
                !inMonth && "text-muted-foreground/40",
                past && "text-muted-foreground/30 cursor-not-allowed",
                !past && !selected && "hover:bg-muted",
                selected && "bg-accent text-accent-foreground font-semibold"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
      {selectedDates.length > 0 && (
        <div className="mt-3 pt-3 border-t text-[11px] text-muted-foreground">
          선택: <span className="text-foreground font-medium">{selectedDates.length}일</span>
        </div>
      )}
    </div>
  );
}
