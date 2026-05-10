import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/ui/MobileHeader";
import type { MeetplanEvent } from "@meetplan/shared";
import type { CellGridModel } from "./slotsToCells";
import type { RespondState } from "./useRespondState";
import { ParticipantGrid } from "./ParticipantGrid";
import { ParticipantForm } from "./ParticipantForm";
import { format, parseISO } from "date-fns";
import { getFirstSelectedSlot } from "./getFirstSelectedSlot";

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
}

export function RespondMobile(props: Props) {
  const firstSlot = getFirstSelectedSlot(props.grid, props.state.selectedSlotIds);

  return (
    <>
      <MobileHeader
        title={props.event.title}
        subtitle={`${props.event.periodMinutes}분 미팅 · 가능 시간 선택`}
      />
      <div className="flex flex-col gap-5 p-4 pb-28">
        <ParticipantGrid
          grid={props.grid}
          selectedSlotIds={props.state.selectedSlotIds}
          onSetSlot={props.onSetSlot}
          viewerTz={props.viewerTz}
        />
        <ParticipantForm
          name={props.state.name}
          phone={props.state.phone}
          onNameChange={props.onNameChange}
          onPhoneChange={props.onPhoneChange}
        />

        <div className="fixed left-0 right-0 bottom-0 bg-background border-t px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {firstSlot ? (
              <>
                <div className="text-[11px] text-muted-foreground">선택한 시간</div>
                <div className="text-sm font-semibold text-primary truncate">
                  {firstSlot.time} ({format(parseISO(firstSlot.date), "M/d")})
                </div>
                {firstSlot.remaining > 0 && (
                  <div className="text-[11px] text-muted-foreground">
                    외 {firstSlot.remaining}개 시간대
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">시간을 선택해주세요</div>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {props.submitError && (
              <span className="text-[11px] text-destructive">{props.submitError}</span>
            )}
            <Button size="lg" disabled={!props.canSubmit} onClick={props.onSubmit}>
              {props.submitting ? "저장 중…" : "제출"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
