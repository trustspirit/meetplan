import { Button } from "@/components/ui/button";
import type { MeetplanEvent } from "@meetplan/shared";
import { useAuth } from "@/features/auth/useAuth";
import type { CellGridModel } from "./slotsToCells";
import type { RespondState } from "./useRespondState";
import { ParticipantGrid } from "./ParticipantGrid";
import { ParticipantForm } from "./ParticipantForm";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <header className="flex items-start justify-between pb-6 border-b">
        <div>
          <h1 className="text-xl font-semibold">{props.event.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {t('respond.subtitle', { periodMinutes: props.event.periodMinutes })}
          </p>
          {props.event.description && (
            <p className="mt-2 text-sm text-foreground/80 whitespace-pre-wrap max-w-lg">{props.event.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!user && (
            <button onClick={signInWithGoogle} className="text-xs text-muted-foreground hover:underline">
              {t('respond.googleSignIn')}
            </button>
          )}
          {user && (
            <span className="text-xs text-muted-foreground">{user.email}</span>
          )}
          <LanguageToggle />
        </div>
      </header>

      <div className="py-8 flex flex-col gap-8">
        <ParticipantGrid
          grid={props.grid}
          selectedSlotIds={props.state.selectedSlotIds}
          onSetSlot={props.onSetSlot}
          viewerTz={props.viewerTz}
        />
        <ParticipantForm
          name={props.state.name}
          phone={props.state.phone}
          note={props.state.note}
          onNameChange={props.onNameChange}
          onPhoneChange={props.onPhoneChange}
          onNoteChange={props.onNoteChange}
        />
      </div>

      <footer className="sticky bottom-0 -mx-6 px-6 py-3 bg-muted/80 backdrop-blur border-t flex items-center justify-between">
        <div className="text-sm">
          {t('respond.selectedCount', { count: props.state.selectedSlotIds.size })}
        </div>
        <div className="flex items-center gap-3">
          {props.submitError && <span className="text-xs text-destructive">{props.submitError}</span>}
          <Button disabled={!props.canSubmit} onClick={props.onSubmit}>
            {props.submitting ? t('respond.saving') : t('respond.submit')}
          </Button>
        </div>
      </footer>
    </div>
  );
}

