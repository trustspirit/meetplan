import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { t } from "@/lib/i18n";

interface Props {
  name: string;
  editUrl: string;
  slotCount: number;
  periodMinutes: number;
  collectPhone: boolean;
}

export function SubmitSuccessAnon({ name, editUrl, slotCount, periodMinutes, collectPhone }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(editUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // clipboard 차단 환경 — 사용자가 수동 복사
    }
  };

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

        <div className="mt-5 bg-surface-subtle rounded-xl p-4 text-left">
          <div className="text-sm font-medium text-text mb-2">
            {t('success.editLink')}{" "}
            <span className="text-text-muted font-normal text-xs">{t('success.editLinkNote')}</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-2xs font-mono text-text-muted bg-surface border rounded px-2 py-1.5 truncate">
              {editUrl}
            </code>
            <button
              type="button"
              onClick={onCopy}
              className="flex items-center gap-1.5 bg-foreground text-background rounded-lg px-3 py-1.5 text-xs font-medium shrink-0 hover:bg-foreground/90 transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? t('success.copied') : t('success.copy')}
            </button>
          </div>
          <p className="text-2xs text-text-muted mt-2">
            {t('success.editLinkSave')}
          </p>
        </div>

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
