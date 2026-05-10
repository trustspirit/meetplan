import { useState } from "react";
import { Check, Copy } from "lucide-react";

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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 차단 환경 — 사용자가 수동 복사
    }
  };

  return (
    <div className="max-w-xl mx-auto min-h-screen bg-background">
      <div className="bg-zinc-900 text-white px-6 py-8 text-center">
        <Check size={28} className="mx-auto mb-2" />
        <div className="font-semibold text-base">응답 완료</div>
      </div>
      <div className="px-6 py-6 text-center">
        <div className="font-semibold text-base">{name} 님, 감사합니다!</div>
        <div className="text-sm text-muted-foreground mt-1">
          {periodMinutes}분 미팅 · {slotCount}개 시간대 선택
        </div>

        <div className="mt-5 bg-slate-50 rounded-xl p-4 text-left">
          <div className="text-sm font-medium text-foreground mb-2">
            수정 링크{" "}
            <span className="text-muted-foreground font-normal text-[12px]">(변경 시에만 필요)</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] font-mono text-muted-foreground bg-background border rounded px-2 py-1.5 truncate">
              {editUrl}
            </code>
            <button
              type="button"
              onClick={onCopy}
              className="flex items-center gap-1.5 bg-zinc-900 text-white rounded-lg px-3 py-1.5 text-xs font-medium shrink-0 hover:bg-zinc-800 transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            저장 안 해도 괜찮아요 — 수정할 때만 필요합니다
          </p>
        </div>

        <p className="text-[11px] text-muted-foreground mt-5">
          호스트가 일정을 확정하면 문자로 알려드려요
        </p>
      </div>
    </div>
  );
}
