import { Check } from "lucide-react";

interface Props {
  name: string;
  slotCount: number;
  periodMinutes: number;
}

export function SubmitSuccessAuthed({ name, slotCount, periodMinutes }: Props) {
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
        <p className="text-sm text-muted-foreground mt-3">
          같은 계정으로 재접속하면 수정할 수 있어요.
        </p>
        <p className="text-[11px] text-muted-foreground mt-4">
          호스트가 일정을 확정하면 문자로 알려드려요
        </p>
      </div>
    </div>
  );
}
