import { Check } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { t } from "@/lib/i18n";

interface Props {
  name: string;
  slotCount: number;
  periodMinutes: number;
  collectPhone: boolean;
}

export function SubmitSuccessAuthed({ name, slotCount, periodMinutes, collectPhone }: Props) {
  return (
    <PublicShell>
     <div className="mx-auto max-w-xl overflow-hidden rounded-lg border border-border bg-surface">
      <div className="bg-primary text-primary-foreground px-6 py-8 text-center">
        <Check size={28} className="mx-auto mb-2" />
        <div className="font-semibold text-base">{t('success.title')}</div>
      </div>
      <div className="px-6 py-6 text-center">
        <div className="font-semibold text-base">{t('success.thanks', { name })}</div>
        <div className="text-sm text-text-muted mt-1">
          {t('success.meetingInfo', { periodMinutes, slotCount })}
        </div>
        <p className="text-sm text-text-muted mt-3">
          {t('success.authedHint')}
        </p>
        <div className="mt-5 text-left">
          <div className="text-2xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            {t('success.nextStepsTitle')}
          </div>
          <ol className="flex flex-col gap-2">
            {([
              t('success.nextStep1'),
              collectPhone ? t('success.nextStep2') : t('success.nextStep2NoPhone'),
            ] as string[]).map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-text-muted">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-2xs font-bold text-text">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
     </div>
    </PublicShell>
  );
}
