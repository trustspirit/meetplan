import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { deleteEventCallable } from "@/lib/callable";

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
      setError(e instanceof Error ? e.message : "삭제 실패");
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
        variant="outline"
        size="sm"
        onClick={() => setConfirming(true)}
        className="border-destructive text-destructive hover:bg-destructive/10"
      >
        이벤트 삭제
      </Button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
    >
      <div className="bg-background rounded-xl border shadow-lg max-w-sm w-full p-5">
        <h2 id="delete-dialog-title" className="text-base font-semibold">
          이벤트를 삭제하시겠어요?
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          "<b>{eventTitle}</b>"와 모든 응답({responseCount}명)이 영구 삭제됩니다. 되돌릴 수 없어요.
        </p>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <Button ref={cancelRef} variant="outline" size="sm" onClick={handleCancel} disabled={deleting}>
            취소
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete} disabled={deleting}>
            {deleting ? "삭제 중…" : "영구 삭제"}
          </Button>
        </div>
      </div>
    </div>
  );
}
