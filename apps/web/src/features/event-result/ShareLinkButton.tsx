import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface Props {
  eventId: string;
}

export function ShareLinkButton({ eventId }: Props) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/e/${eventId}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Clipboard blocked — silent
    }
  };

  return (
    <Button variant="secondary" size="sm" onClick={onCopy}>
      {copied ? (
        <><Check size={13} className="mr-1.5" />{t('share.copied')}</>
      ) : (
        <><Link2 size={13} className="mr-1.5" />{t('share.button')}</>
      )}
    </Button>
  );
}
