import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PeriodPicker } from "./PeriodPicker";
import { t } from "@/lib/i18n";

interface Props {
  title: string;
  onTitleChange: (v: string) => void;
  periodMinutes: number;
  onPeriodChange: (v: number) => void;
}

export function BasicInfoForm({ title, onTitleChange, periodMinutes, onPeriodChange }: Props) {
  return (
    <section className="flex flex-col gap-5">
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
      <div>
        <Label>{t('form.meetingLength')}</Label>
        <div className="mt-2">
          <PeriodPicker value={periodMinutes} onChange={onPeriodChange} />
        </div>
      </div>
    </section>
  );
}
