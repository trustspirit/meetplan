import { Button } from "@/components/ui/button";
import type { MeetplanEvent } from "@meetplan/shared";
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

export function RespondMobile(props: Props) {
  return (
    <div className="flex flex-col gap-5 p-4 pb-24">
      <header className="pb-3 border-b">
        <h1 className="font-semibold">{props.event.title}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {props.event.periodMinutes}분 미팅 · 가능 시간 선택
        </p>
      </header>

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

      <div className="fixed left-0 right-0 bottom-0 bg-background border-t px-4 py-3 flex items-center justify-between">
        <span className="text-sm">선택 <b className="text-accent">{props.state.selectedSlotIds.size}</b></span>
        <div className="flex gap-2 items-center">
          {props.submitError && <span className="text-[11px] text-destructive">{props.submitError}</span>}
          <Button size="lg" disabled={!props.canSubmit} onClick={props.onSubmit}>
            {props.submitting ? "저장 중…" : "제출"}
          </Button>
        </div>
      </div>
    </div>
  );
}
