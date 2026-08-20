import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/features/auth/useAuth";
import type { MeetplanEvent } from "@meetplan/shared";
import type { CellGridModel } from "./slotsToCells";
import type { RespondState } from "./useRespondState";
import { buildSelectionModel } from "./selectionModel";
import { SelectionSummary } from "./SelectionSummary";
import { ParticipantGrid } from "./ParticipantGrid";
import { ParticipantForm } from "./ParticipantForm";
import { t } from "@/lib/i18n";

interface Props {
  event: MeetplanEvent;
  grid: CellGridModel;
  state: RespondState;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onSetSlot: (slotId: string, on: boolean) => void;
  onClearDate: (grid: CellGridModel, dateYmd: string) => void;
  viewerTz: string;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
  submitError: string | null;
}

export function RespondDesktop(props: Props) {
  const { user, signInWithGoogle } = useAuth();

  const selections = useMemo(
    () => buildSelectionModel(props.grid, props.state.selectedSlotIds),
    [props.grid, props.state.selectedSlotIds]
  );

  const selectedCount = props.state.selectedSlotIds.size;
  const selectedDays = selections.filter((s) => s.selectedTimes.length > 0).length;

  const missingReason =
    !props.state.name.trim() ? t('respond.missingName')
    : selectedCount === 0 ? t('respond.missingSlots')
    : !props.canSubmit ? t('respond.missingPhone')
    : null;

  const scrollToCell = (dateYmd: string, hhmm: string) => {
    document
      .querySelector(`[data-cell-key="${dateYmd}_${hhmm}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  };

  return (
    <>
      <PageHeader
        title={props.event.title}
        subtitle={t('respond.subtitle', { periodMinutes: props.event.periodMinutes })}
        primaryAction={
          !user ? (
            <Button variant="link" size="sm" onClick={signInWithGoogle}>
              {t('respond.googleSignIn')}
            </Button>
          ) : (
            <span className="text-xs text-text-muted">{user.email}</span>
          )
        }
      />

      {props.event.description && (
        <p className="mb-6 max-w-2xl whitespace-pre-wrap rounded-lg bg-surface-subtle px-4 py-3 text-sm text-text">
          {props.event.description}
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-6 pb-24 lg:grid-cols-[1fr_300px]">
        <ParticipantGrid
          grid={props.grid}
          selectedSlotIds={props.state.selectedSlotIds}
          onSetSlot={props.onSetSlot}
          viewerTz={props.viewerTz}
        />

        {/* 좁은 화면에서는 사이드를 접고 폼을 그리드 아래로 되돌린다. */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
          <SelectionSummary
            selections={selections}
            onPick={scrollToCell}
            className="hidden lg:block"
          />
          <ParticipantForm
            name={props.state.name}
            phone={props.state.phone}
            note={props.state.note}
            onNameChange={props.onNameChange}
            onPhoneChange={props.onPhoneChange}
            onNoteChange={props.onNoteChange}
          />
        </aside>
      </div>

      <StickyActionBar>
        <div className="min-w-0">
          <span className="text-sm text-text">
            {t('respond.selectedCount', { count: selectedCount })}
            {selectedDays > 0 && ` · ${t('respond.selectedDays', { count: selectedDays })}`}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {(props.submitError ?? missingReason) && (
            <span className="text-xs text-danger">{props.submitError ?? missingReason}</span>
          )}
          <Button disabled={!props.canSubmit} onClick={props.onSubmit}>
            {props.submitting ? t('respond.saving') : t('respond.submit')}
          </Button>
        </div>
      </StickyActionBar>
    </>
  );
}
