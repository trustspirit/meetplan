import type { CalendarListItem } from "../event-respond/useGoogleCalendarBusy";

interface Props {
  syncing: boolean;
  error: string | null;
  onConnect: () => void;
  onSkip: () => void;
  disabled?: boolean;
  // Step 2: calendar picker (shown after connectCalendar() resolves)
  calendarList?: CalendarListItem[];
  selectedCalendarId?: string | null;
  onCalendarIdChange?: (id: string) => void;
  onApply?: () => void;
}

export function CalendarBanner({
  syncing, error, onConnect, onSkip, disabled,
  calendarList = [], selectedCalendarId, onCalendarIdChange, onApply,
}: Props) {
  const showPicker = calendarList.length > 0;

  return (
    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none mt-0.5">📅</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">구글 캘린더 연동</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {showPicker
              ? "참고할 캘린더를 선택하세요"
              : disabled
              ? "날짜를 먼저 선택하면 기존 일정을 확인할 수 있습니다"
              : "기존 일정이 있는 시간대를 페인팅 그리드에서 확인하세요"}
          </p>
          {error && <p className="text-xs text-destructive mt-1">{error} — 다시 시도하거나 건너뛰세요</p>}
        </div>
        {/* Skip is always available */}
        <button
          type="button"
          onClick={onSkip}
          disabled={syncing}
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 px-2 py-1 shrink-0"
        >
          건너뛰기
        </button>
      </div>

      {showPicker ? (
        /* Step 2: calendar dropdown + apply */
        <div className="flex items-center gap-2">
          <select
            value={selectedCalendarId ?? ""}
            onChange={(e) => onCalendarIdChange?.(e.target.value)}
            className="flex-1 text-xs rounded-md border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {calendarList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.summary}{c.primary ? " (기본)" : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onApply}
            disabled={syncing || !selectedCalendarId}
            className="text-xs font-medium bg-accent text-accent-foreground rounded-md px-3 py-1.5 hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
          >
            {syncing ? "불러오는 중…" : "적용"}
          </button>
        </div>
      ) : (
        /* Step 1: connect button */
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onConnect}
            disabled={syncing || disabled}
            className="text-xs font-medium bg-accent text-accent-foreground rounded-md px-3 py-1.5 hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {syncing ? "연결 중…" : "연동하기"}
          </button>
        </div>
      )}
    </div>
  );
}
