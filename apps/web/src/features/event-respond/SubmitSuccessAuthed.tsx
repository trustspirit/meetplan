import { Check } from "lucide-react";
import { t } from "@/lib/i18n";

interface Props {
  name: string;
  slotCount: number;
  periodMinutes: number;
}

export function SubmitSuccessAuthed({ name, slotCount, periodMinutes }: Props) {
  return (
    <div className="max-w-xl mx-auto min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground px-6 py-8 text-center">
        <Check size={28} className="mx-auto mb-2" />
        <div className="font-semibold text-base">{t('success.title')}</div>
      </div>
      <div className="px-6 py-6 text-center">
        <div className="font-semibold text-base">{t('success.thanks', { name })}</div>
        <div className="text-sm text-muted-foreground mt-1">
          {t('success.meetingInfo', { periodMinutes, slotCount })}
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          {t('success.authedHint')}
        </p>
        <p className="text-[11px] text-muted-foreground mt-4">
          {t('success.organizerWillNotify')}
        </p>
      </div>
    </div>
  );
}
