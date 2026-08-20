import { Calendar } from "lucide-react";
import type { CalendarListItem } from "../event-respond/useGoogleCalendarBusy";
import { t } from "@/lib/i18n";

interface Props {
  syncing: boolean;
  error: string | null;
  onConnect: () => void;
  onSkip: () => void;
  disabled?: boolean;
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
    <div className="rounded-xl border border-border bg-surface-subtle/40 px-4 py-3 flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <Calendar size={16} className="text-text-muted shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{t('calendar.title')}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {showPicker
              ? t('calendar.hintPicker')
              : disabled
              ? t('calendar.hintDisabled')
              : t('calendar.hint')}
          </p>
          {error && (
            <p className="text-xs text-danger mt-1">
              {error} {t('calendar.errorSuffix')}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onSkip}
          disabled={syncing}
          className="text-xs text-text-muted hover:text-text disabled:opacity-50 px-2 py-1 shrink-0"
        >
          {t('calendar.skip')}
        </button>
      </div>

      {showPicker ? (
        <div className="flex items-center gap-2">
          <select
            value={selectedCalendarId ?? ""}
            onChange={(e) => onCalendarIdChange?.(e.target.value)}
            className="flex-1 text-xs rounded-md border border-border bg-surface px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {calendarList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.summary}{c.primary ? ` ${t('calendar.primary')}` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onApply}
            disabled={syncing || !selectedCalendarId}
            className="text-xs font-medium bg-primary text-primary-foreground rounded-md px-3 py-1.5 hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
          >
            {syncing ? t('calendar.loading') : t('calendar.apply')}
          </button>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onConnect}
            disabled={syncing || disabled}
            className="text-xs font-medium bg-primary text-primary-foreground rounded-md px-3 py-1.5 hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {syncing ? t('calendar.connecting') : t('calendar.connect')}
          </button>
        </div>
      )}
    </div>
  );
}
