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
        <div className="mt-5 text-left">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t('success.nextStepsTitle')}
          </div>
          <ol className="flex flex-col gap-2">
            {([t('success.nextStep1'), t('success.nextStep2')] as string[]).map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[12px] text-muted-foreground">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
