import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
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
      <div className="flex flex-col gap-2">
        <Label>{t('eventType.label')}</Label>
        <div className="flex w-fit overflow-hidden rounded-lg border border-border">
          {(["meeting", "ward_visit"] as EventType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onEventTypeChange(type)}
              aria-pressed={eventType === type}
              className={cn(
                "h-11 px-4 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                type !== "meeting" && "border-l border-border",
                eventType === type
                  ? "bg-primary text-primary-foreground"
                  : "text-text-muted hover:bg-surface-subtle hover:text-text"
              )}
            >
              {type === "meeting" ? t('eventType.meeting') : t('eventType.wardVisit')}
            </button>
          ))}
        </div>
      </div>

      <Field label={t('form.eventTitle')} htmlFor="ev-title">
        <Input
          id="ev-title"
          placeholder={t('form.eventTitlePlaceholder')}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </Field>

      <Field
        label={t('form.notes')}
        htmlFor="ev-notes"
        aside={<span className="text-2xs text-text-muted tabular-nums">{notes.length}/500</span>}
      >
        <Textarea
          id="ev-notes"
          rows={3}
          maxLength={500}
          placeholder={t('form.notesPlaceholder')}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </Field>

      {/* Stake selector — ward_visit only */}
      {isWardVisit && (
        <Field label={t('ward.stakeLabel')} htmlFor="ev-stake">
          <Select
            id="ev-stake"
            value={stakeId}
            onChange={(e) => onStakeChange(e.target.value)}
          >
            <option value="">{t('ward.stakePlaceholder')}</option>
            {STAKES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </Field>
      )}

      {/* Meeting length — meeting only */}
      {!isWardVisit && (
        <div className="flex flex-col gap-2">
          <Label>{t('form.meetingLength')}</Label>
          <PeriodPicker value={periodMinutes} onChange={onPeriodChange} />
        </div>
      )}
    </section>
  );
}
