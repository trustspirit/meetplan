import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BasicInfoForm } from "./BasicInfoForm";
import { MultiDateCalendar } from "./MultiDateCalendar";
import { TimePainter } from "./TimePainter";
import { useEventCreateState } from "./useEventCreateState";

export default function EventCreatePage() {
  const {
    state,
    setTitle,
    setPeriod,
    toggleDate,
    setDailyRange,
    setCellPainted,
  } = useEventCreateState();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between pb-6 border-b">
        <Link to="/dashboard" className="text-sm hover:underline">← 돌아가기</Link>
        <h1 className="font-semibold">새 이벤트 만들기</h1>
        <Button disabled>생성 (다음 Task)</Button>
      </header>

      <div className="py-8 flex flex-col gap-10">
        <BasicInfoForm
          title={state.title}
          onTitleChange={setTitle}
          periodMinutes={state.periodMinutes}
          onPeriodChange={setPeriod}
        />
        <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          <MultiDateCalendar selectedDates={state.selectedDates} onToggleDate={toggleDate} />
          <TimePainter
            selectedDates={state.selectedDates}
            dailyRange={state.dailyRange}
            periodMinutes={state.periodMinutes}
            paintedCells={state.paintedCells}
            onSetCell={setCellPainted}
            onChangeRange={setDailyRange}
          />
        </section>
      </div>
    </div>
  );
}
