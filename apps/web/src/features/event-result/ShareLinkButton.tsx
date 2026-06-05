import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface Props {
  eventId: string;
  compact?: boolean;
}

export function ShareLinkButton({ eventId, compact }: Props) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/e/${eventId}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — silent
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={onCopy}
        className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
        aria-label={t('share.ariaLabel')}
      >
        {copied ? <Check size={13} /> : <Link2 size={13} />}
        {copied ? t('share.copied') : t('share.compact')}
      </button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={onCopy}>
      {copied ? (
        <><Check size={13} className="mr-1.5" />{t('share.copied')}</>
      ) : (
        <><Link2 size={13} className="mr-1.5" />{t('share.button')}</>
      )}
    </Button>
  );
}
