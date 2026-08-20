import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { PageHeader } from "@/components/layout/PageHeader";
import type { MeetplanEvent, ResponseField } from "@meetplan/shared";
import type { CellGridModel } from "./slotsToCells";
import type { RespondState } from "./useRespondState";
import { buildSelectionModel } from "./selectionModel";
import { DateSelectStep } from "./DateSelectStep";
import { TimeSelectStep } from "./TimeSelectStep";
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
  missingReason: string | null;
  collectPhone: boolean;
  fields: ResponseField[];
  onAnswerChange: (fieldId: string, value: string) => void;
}

/** 호스트 날짜가 이 수 이하면 Step 1은 순수 오버헤드라 건너뛴다 (스펙 §8.5). */
const SKIP_DATE_STEP_THRESHOLD = 2;

export function RespondMobile(props: Props) {
  const selections = useMemo(
    () => buildSelectionModel(props.grid, props.state.selectedSlotIds),
    [props.grid, props.state.selectedSlotIds]
  );

  const skipDateStep = props.grid.dates.length <= SKIP_DATE_STEP_THRESHOLD;

  // 기존 응답 수정으로 들어오면 선택된 슬롯이 있는 날짜를 미리 체크한다.
  const [pickedDates, setPickedDates] = useState<Set<string>>(() => {
    if (skipDateStep) return new Set(props.grid.dates);
    return new Set(selections.filter((s) => s.selectedTimes.length > 0).map((s) => s.dateYmd));
  });

  const [step, setStep] = useState<1 | 2>(skipDateStep ? 2 : 1);

  const toggleDate = (dateYmd: string) => {
    setPickedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateYmd)) {
        next.delete(dateYmd);
        props.onClearDate(props.grid, dateYmd);   // 날짜를 빼면 그 날짜의 시간 선택도 지운다
      } else {
        next.add(dateYmd);
      }
      return next;
    });
  };

  const orderedPicked = props.grid.dates.filter((d) => pickedDates.has(d));
  const selectedCount = props.state.selectedSlotIds.size;

  const emptyDate = orderedPicked.find(
    (d) => (selections.find((s) => s.dateYmd === d)?.selectedTimes.length ?? 0) === 0
  );

  const handleSubmit = () => {
    if (emptyDate) {
      document.getElementById(`date-section-${emptyDate}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    props.onSubmit();
  };

  return (
    <>
      <PageHeader
        title={props.event.title}
        subtitle={t('respond.subtitleMobile', { periodMinutes: props.event.periodMinutes })}
        {...(step === 2 && !skipDateStep
          ? { onBack: () => setStep(1), backLabel: t('respond.backToDates') }
          : {})}
      />

      {/* 진행 표시 */}
      {!skipDateStep && (
        <div className="mb-4 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-subtle">
            <div className={`h-full rounded-full bg-primary transition-all ${step === 1 ? "w-1/2" : "w-full"}`} />
          </div>
          <span className="text-2xs font-medium text-text-muted">
            {t('wizard.progress', { current: step, total: 2 })}
          </span>
        </div>
      )}

      <div className="pb-28">
        {props.event.description && (
          <p className="mb-4 whitespace-pre-wrap rounded-lg bg-surface-subtle px-3 py-2.5 text-sm text-text">
            {props.event.description}
          </p>
        )}

        {step === 1 ? (
          <DateSelectStep
            grid={props.grid}
            selections={selections}
            selectedDates={pickedDates}
            onToggleDate={toggleDate}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <TimeSelectStep
              grid={props.grid}
              selections={selections}
              dates={orderedPicked}
              selectedSlotIds={props.state.selectedSlotIds}
              onSetSlot={props.onSetSlot}
            />
            <ParticipantForm
              name={props.state.name}
              phone={props.state.phone}
              note={props.state.note}
              onNameChange={props.onNameChange}
              onPhoneChange={props.onPhoneChange}
              onNoteChange={props.onNoteChange}
              collectPhone={props.collectPhone}
              fields={props.fields}
              answers={props.state.answers}
              onAnswerChange={props.onAnswerChange}
            />
          </div>
        )}
      </div>

      <StickyActionBar>
        {step === 1 ? (
          <>
            <span className="text-sm text-text-muted">
              {t('respond.selectedDays', { count: pickedDates.size })}
            </span>
            <Button size="lg" disabled={pickedDates.size === 0} onClick={() => setStep(2)}>
              {t('respond.next')} →
            </Button>
          </>
        ) : (
          <>
            <div className="min-w-0">
              <span className="block text-sm text-text-muted">
                {t('respond.selectedCount', { count: selectedCount })}
              </span>
              {(props.submitError ?? props.missingReason) && (
                <span className="block truncate text-2xs text-danger">
                  {props.submitError ?? props.missingReason}
                </span>
              )}
            </div>
            <Button size="lg" disabled={!props.canSubmit} onClick={handleSubmit}>
              {props.submitting ? t('respond.saving') : t('respond.submit')}
            </Button>
          </>
        )}
      </StickyActionBar>
    </>
  );
}
