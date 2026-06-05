import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { t } from "@/lib/i18n";

interface Props {
  name: string;
  editUrl: string;
  slotCount: number;
  periodMinutes: number;
}

export function SubmitSuccessAnon({ name, editUrl, slotCount, periodMinutes }: Props) {
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

        <div className="mt-5 bg-slate-50 rounded-xl p-4 text-left">
          <div className="text-sm font-medium text-foreground mb-2">
            {t('success.editLink')}{" "}
            <span className="text-muted-foreground font-normal text-[12px]">{t('success.editLinkNote')}</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] font-mono text-muted-foreground bg-background border rounded px-2 py-1.5 truncate">
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
          <p className="text-[11px] text-muted-foreground mt-2">
            {t('success.editLinkSave')}
          </p>
        </div>

        <p className="text-[11px] text-muted-foreground mt-5">
          {t('success.organizerWillNotify')}
        </p>
      </div>
    </div>
  );
}
