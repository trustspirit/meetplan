import { useState } from "react";
import { Button } from "@/components/ui/button";

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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (HTTP-only, permission, etc.) — silent, user can copy from URL bar
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={onCopy}>
      {copied ? "✓ 복사됨" : "🔗 공유 링크 복사"}
    </Button>
  );
}
