import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BasicInfoForm } from "./BasicInfoForm";
import { useEventCreateState } from "./useEventCreateState";

export default function EventCreatePage() {
  const { state, setTitle, setPeriod } = useEventCreateState();

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between pb-6 border-b">
        <Link to="/dashboard" className="text-sm hover:underline">
          ← 돌아가기
        </Link>
        <h1 className="font-semibold">새 이벤트 만들기</h1>
        <Button disabled>생성</Button>
      </header>

      <div className="py-8 flex flex-col gap-10">
        <BasicInfoForm
          title={state.title}
          onTitleChange={setTitle}
          periodMinutes={state.periodMinutes}
          onPeriodChange={setPeriod}
        />
        <section className="text-sm text-muted-foreground">
          [캘린더 + 페인터는 다음 Task에서]
        </section>
      </div>
    </div>
  );
}
