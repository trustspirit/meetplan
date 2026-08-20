import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";

export interface MenuItem {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  tone?: "default" | "warning" | "danger";
}

interface Props {
  items: MenuItem[];
  /** 커스텀 트리거. 없으면 ⋮ 아이콘 버튼을 쓴다. */
  trigger?: ReactNode;
  align?: "left" | "right";
  /** 기본 트리거의 접근 가능한 이름. */
  label: string;
}

export function Menu({ items, trigger, align = "right", label }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      {trigger ? (
        <span onClick={() => setOpen((v) => !v)}>{trigger}</span>
      ) : (
        <IconButton aria-label={label} onClick={() => setOpen((v) => !v)}>
          <MoreVertical size={18} aria-hidden />
        </IconButton>
      )}

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-surface shadow-md",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, i) => {
            const prev = items[i - 1];
            const showDivider = item.tone === "danger" && i > 0 && prev?.tone !== "danger";
            return (
              <div key={item.label}>
                {showDivider && <div className="mx-3 my-1 border-t border-border" />}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { item.onClick(); setOpen(false); }}
                  className={cn(
                    "flex min-h-touch w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors",
                    "hover:bg-surface-subtle focus-visible:bg-surface-subtle focus-visible:outline-none",
                    item.tone === "danger" && "text-danger",
                    item.tone === "warning" && "text-warning",
                    (!item.tone || item.tone === "default") && "text-text"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
