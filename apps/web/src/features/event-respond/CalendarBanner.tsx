interface Props {
  syncing: boolean;
  error: string | null;
  onConnect: () => void;
  onSkip: () => void;
}

export function CalendarBanner({ syncing, error, onConnect, onSkip }: Props) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none mt-0.5">📅</span>
        <div>
          <p className="text-sm font-medium">구글 캘린더 연동</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            기존 일정이 있는 시간대를 그리드에서 한눈에 확인하세요
          </p>
          {error && <p className="text-xs text-destructive mt-1">{error} — 다시 시도하거나 건너뛰세요</p>}
        </div>
      </div>
      <div className="flex gap-2 items-center self-end sm:self-auto shrink-0">
        <button
          type="button"
          onClick={onSkip}
          disabled={syncing}
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 px-2 py-1"
        >
          건너뛰기
        </button>
        <button
          type="button"
          onClick={onConnect}
          disabled={syncing}
          className="text-xs font-medium bg-accent text-accent-foreground rounded-md px-3 py-1.5 hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {syncing ? "연동 중…" : "연동하기"}
        </button>
      </div>
    </div>
  );
}
