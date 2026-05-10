import { useState, useEffect, useRef } from "react";
import { ChevronLeft, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "warning" | "danger";
}

interface Props {
  title?: string;
  subtitle?: string;
  logo?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  menuItems?: MenuItem[];
}

export function MobileHeader({ title, subtitle, logo, onBack, actions, menuItems }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <header className="sm:hidden flex items-center gap-2 px-3 py-2.5 bg-zinc-900 text-white sticky top-0 z-30">
      {logo ? (
        <span className="font-bold text-base mr-1">MeetPlan</span>
      ) : onBack ? (
        <button type="button" onClick={onBack} className="p-1 rounded-md hover:bg-white/10 -ml-1 shrink-0">
          <ChevronLeft size={20} />
        </button>
      ) : null}

      {title && (
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-tight truncate">{title}</div>
          {subtitle && <div className="text-[11px] text-white/50 truncate">{subtitle}</div>}
        </div>
      )}
      {!title && <div className="flex-1" />}

      {actions}

      {menuItems && menuItems.length > 0 && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-md hover:bg-white/10"
            aria-label="더보기"
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border bg-background text-foreground shadow-lg overflow-hidden z-50">
              {menuItems.map((item, i) => {
                const isDanger = item.variant === "danger";
                const isWarning = item.variant === "warning";
                const prevItem = menuItems[i - 1];
                const showDivider = isDanger && i > 0 && prevItem?.variant !== "danger";
                return (
                  <div key={i}>
                    {showDivider && <div className="border-t mx-3 my-1" />}
                    <button
                      type="button"
                      onClick={() => { item.onClick(); setMenuOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors",
                        isDanger && "text-destructive",
                        isWarning && "text-amber-600"
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
      )}
    </header>
  );
}
