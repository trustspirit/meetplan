import { Button } from "@/components/ui/button";
import type { MeetplanEvent } from "@meetplan/shared";
import { useAuth } from "@/features/auth/useAuth";
import type { CellGridModel } from "./slotsToCells";
import type { RespondState } from "./useRespondState";
import { ParticipantGrid } from "./ParticipantGrid";
import { ParticipantForm } from "./ParticipantForm";
import { CalendarBanner } from "./CalendarBanner";

interface Props {
  event: MeetplanEvent;
  grid: CellGridModel;
  state: RespondState;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onSetSlot: (slotId: string, on: boolean) => void;
  viewerTz: string;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
  submitError: string | null;
  busySlotIds?: Set<string>;
  calendarChoice?: "pending" | "dismissed";
  calendarSyncing?: boolean;
  calendarError?: string | null;
  calendarSynced?: boolean;
  onCalendarConnect?: () => void;
  onCalendarSkip?: () => void;
}

export function RespondDesktop(props: Props) {
  const { user, signInWithGoogle } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <header className="flex items-start justify-between pb-6 border-b">
        <div>
          <h1 className="text-xl font-semibold">{props.event.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {props.event.periodMinutes}분 미팅 · 가능한 시간을 선택해주세요
          </p>
        </div>
        {!user && (
          <button onClick={signInWithGoogle} className="text-xs text-muted-foreground hover:underline">
            Google 로그인
          </button>
        )}
        {user && (
          <span className="text-xs text-muted-foreground">{user.email}</span>
        )}
      </header>

      <div className="py-8 flex flex-col gap-6">
        {props.calendarChoice === "pending" && props.onCalendarConnect && (
          <CalendarBanner
            syncing={props.calendarSyncing ?? false}
            error={props.calendarError ?? null}
            onConnect={props.onCalendarConnect}
            onSkip={props.onCalendarSkip!}
          />
        )}
        {props.calendarSynced && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span>📅</span> 구글 캘린더 연동됨 — 줄무늬 셀에 기존 일정이 있습니다
          </p>
        )}
        <ParticipantGrid
          grid={props.grid}
          selectedSlotIds={props.state.selectedSlotIds}
          onSetSlot={props.onSetSlot}
          viewerTz={props.viewerTz}
          {...(props.busySlotIds ? { busySlotIds: props.busySlotIds } : {})}
        />
        <ParticipantForm
          name={props.state.name}
          phone={props.state.phone}
          onNameChange={props.onNameChange}
          onPhoneChange={props.onPhoneChange}
        />
      </div>

      <footer className="sticky bottom-0 -mx-6 px-6 py-3 bg-muted/80 backdrop-blur border-t flex items-center justify-between">
        <div className="text-sm">
          선택: <span className="font-semibold text-accent">{props.state.selectedSlotIds.size}개</span>
        </div>
        <div className="flex items-center gap-3">
          {props.submitError && <span className="text-xs text-destructive">{props.submitError}</span>}
          <Button disabled={!props.canSubmit} onClick={props.onSubmit}>
            {props.submitting ? "저장 중…" : "제출"}
          </Button>
        </div>
      </footer>
    </div>
  );
}
