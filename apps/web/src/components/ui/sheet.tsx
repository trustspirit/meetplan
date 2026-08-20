import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "./icon-button";
import { t } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** 모바일 하단에서 올라오는 모달. 데스크탑에서는 Menu를 쓴다. */
export function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    // 시트가 열려 있는 동안 뒤 콘텐츠가 스크롤되지 않게 한다.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        data-testid="sheet-backdrop"
        className="absolute inset-0 bg-text/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-xl border-t border-border bg-surface pb-[max(1rem,env(safe-area-inset-bottom))] shadow-md"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <span className="text-sm font-semibold text-text">{title}</span>
          <IconButton aria-label={t('common.close')} onClick={onClose}>
            <X size={18} aria-hidden />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}
