import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PeriodPicker } from "./PeriodPicker";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { STAKES } from "@meetplan/shared";
import type { EventType } from "@meetplan/shared";

interface Props {
  title: string;
  onTitleChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  periodMinutes: number;
  onPeriodChange: (v: number) => void;
  eventType: EventType;
  onEventTypeChange: (v: EventType) => void;
  stakeId: string;
  onStakeChange: (v: string) => void;
}

export function BasicInfoForm({
  title, onTitleChange,
  notes, onNotesChange,
  periodMinutes, onPeriodChange,
  eventType, onEventTypeChange,
  stakeId, onStakeChange,
}: Props) {
  const isWardVisit = eventType === "ward_visit";

  return (
    <section className="flex flex-col gap-5">
      {/* Event type toggle */}
      <div>
        <Label>{t('eventType.label')}</Label>
        <div className="mt-2 flex rounded-lg border border-border overflow-hidden w-fit">
          {(["meeting", "ward_visit"] as EventType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onEventTypeChange(type)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                type !== "meeting" && "border-l border-border",
                eventType === type
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {type === "meeting" ? t('eventType.meeting') : t('eventType.wardVisit')}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="ev-title">{t('form.eventTitle')}</Label>
        <Input
          id="ev-title"
          className="mt-2"
          placeholder={t('form.eventTitlePlaceholder')}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="ev-notes">{t('form.notes')}</Label>
        <textarea
          id="ev-notes"
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          rows={3}
          maxLength={500}
          placeholder={t('form.notesPlaceholder')}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </div>

      {/* Stake selector — ward_visit only */}
      {isWardVisit && (
        <div>
          <Label htmlFor="ev-stake">{t('ward.stakeLabel')}</Label>
          <select
            id="ev-stake"
            value={stakeId}
            onChange={(e) => onStakeChange(e.target.value)}
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t('ward.stakePlaceholder')}</option>
            {STAKES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Meeting length — meeting only */}
      {!isWardVisit && (
        <div>
          <Label>{t('form.meetingLength')}</Label>
          <div className="mt-2">
            <PeriodPicker value={periodMinutes} onChange={onPeriodChange} />
          </div>
        </div>
      )}
    </section>
  );
}
