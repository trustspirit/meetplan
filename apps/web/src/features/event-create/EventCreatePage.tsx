import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/useAuth";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { eventCreateSchema } from "@meetplan/shared";
import { BasicInfoForm } from "./BasicInfoForm";
import { MultiDateCalendar } from "./MultiDateCalendar";
import { TimePainter } from "./TimePainter";
import { MobileWizard } from "./MobileWizard";
import { useEventCreateState } from "./useEventCreateState";
import { buildSlotsFromPaintedCells } from "./generateSlots";

// 브라우저의 IANA TZ 자동 감지, 폴백 "Asia/Seoul"
const HOST_TZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";

export default function EventCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    state,
    setTitle,
    setPeriod,
    toggleDate,
    setDailyRange,
    setCellPainted,
  } = useEventCreateState();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const slots = buildSlotsFromPaintedCells(state.paintedCells, state.periodMinutes, HOST_TZ);
  const canCreate = state.title.trim().length > 0 && slots.length > 0 && !submitting;

  const handleCreate = async () => {
    if (!user) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        title: state.title.trim(),
        periodMinutes: state.periodMinutes,
        timezone: HOST_TZ,
        slots,
      };
      const parsed = eventCreateSchema.safeParse(payload);
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message ?? "입력 오류");
        setSubmitting(false);
        return;
      }
      const doc = await addDoc(collection(db, "events"), {
        ...parsed.data,
        ownerUid: user.uid,
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate(`/events/${doc.id}/result`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
      setSubmitting(false);
    }
  };

  if (!isDesktop) {
    return (
      <MobileWizard
        title={state.title}
        onTitleChange={setTitle}
        periodMinutes={state.periodMinutes}
        onPeriodChange={setPeriod}
        selectedDates={state.selectedDates}
        onToggleDate={toggleDate}
        dailyRange={state.dailyRange}
        onChangeRange={setDailyRange}
        paintedCells={state.paintedCells}
        onSetCell={setCellPainted}
        onSubmit={handleCreate}
        submitting={submitting}
        canSubmit={canCreate}
        slotCount={slots.length}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between pb-6 border-b">
        <Link to="/dashboard" className="text-sm hover:underline">← 돌아가기</Link>
        <h1 className="font-semibold">새 이벤트 만들기</h1>
        <Button onClick={handleCreate} disabled={!canCreate}>
          {submitting ? "저장 중…" : "생성"}
        </Button>
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

      <footer className="sticky bottom-0 -mx-6 px-6 py-3 bg-muted/80 backdrop-blur border-t flex items-center justify-between text-sm">
        <div>
          자동 생성될 슬롯: <span className="font-semibold text-accent">{slots.length}개</span>
        </div>
        {error && <div className="text-destructive">{error}</div>}
      </footer>
    </div>
  );
}
