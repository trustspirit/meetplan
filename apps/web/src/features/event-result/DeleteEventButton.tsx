import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { deleteEventCallable } from "@/lib/callable";
import { t } from "@/lib/i18n";

interface Props {
  eventId: string;
  eventTitle: string;
  responseCount: number;
  autoOpen?: boolean;
  onClose?: () => void;
}

export function DeleteEventButton({ eventId, eventTitle, responseCount, autoOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(autoOpen ?? false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  const handleCancel = () => {
    if (deleting) return;
    setConfirming(false);
    onClose?.();
  };

  const onDelete = async () => {
    setError(null);
    setDeleting(true);
    try {
      await deleteEventCallable({ eventId });
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('delete.failed'));
      setDeleting(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      handleCancel();
    }
  };

  if (!confirming) {
    if (autoOpen) return null;
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setConfirming(true)}
        className="border-danger text-danger hover:bg-danger/10"
      >
        {t('delete.button')}
      </Button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-text/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-md">
        <h2 id="delete-dialog-title" className="text-base font-semibold">
          {t('delete.title')}
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          {t('delete.confirm', { title: eventTitle, count: responseCount })}
        </p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <Button ref={cancelRef} variant="secondary" size="sm" onClick={handleCancel} disabled={deleting}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete} disabled={deleting}>
            {deleting ? t('delete.deleting') : t('delete.permanentDelete')}
          </Button>
        </div>
      </div>
    </div>
  );
}
