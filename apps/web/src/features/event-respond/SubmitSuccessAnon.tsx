import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  name: string;
  editUrl: string;
  slotCount: number;
}

export function SubmitSuccessAnon({ name, editUrl, slotCount }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(editUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 차단 환경: 사용자가 수동 복사
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
        <div className="inline-block text-[11px] font-semibold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full mb-3">
          ⚠ 중요: 아래 링크를 꼭 저장하세요
        </div>
        <h2 className="text-lg font-semibold">
          {name} 님, 응답이 저장되었습니다 ✓
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          선택한 시간: {slotCount}개 · 나중에 수정하려면 아래 링크가 필요해요.
        </p>
        <div className="mt-4 flex gap-2 items-center bg-background border border-amber-200 rounded-lg px-3 py-2">
          <code className="flex-1 text-[11px] font-mono text-foreground truncate">{editUrl}</code>
          <Button size="sm" onClick={onCopy}>
            {copied ? "✓ 복사됨" : "📋 복사"}
          </Button>
        </div>
        <div className="mt-4 text-[11px] text-amber-900 leading-relaxed">
          <b>이 링크를 저장하는 3가지 방법:</b>
          <ul className="list-disc ml-5 mt-1">
            <li>북마크로 추가 (Cmd/Ctrl + D)</li>
            <li>나에게 카톡/메일로 보내기</li>
            <li>메모 앱에 붙여넣기</li>
          </ul>
        </div>
        <p className="mt-4 pt-4 border-t border-amber-200 text-[11px] text-amber-900">
          💬 수정이 필요 없다면 그냥 이 탭을 닫아도 됩니다.
        </p>
      </div>
    </div>
  );
}
