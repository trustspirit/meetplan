// apps/web/src/features/event-result/ShareLinkButton.tsx
import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  eventId: string;
  compact?: boolean; // true면 아이콘만 (MobileHeader actions용)
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
        aria-label="공유 링크 복사"
      >
        {copied ? <Check size={13} /> : <Link2 size={13} />}
        {copied ? "복사됨" : "공유"}
      </button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={onCopy}>
      {copied ? (
        <><Check size={13} className="mr-1.5" />복사됨</>
      ) : (
        <><Link2 size={13} className="mr-1.5" />공유 링크 복사</>
      )}
    </Button>
  );
}
