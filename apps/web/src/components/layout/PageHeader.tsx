import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MoreVertical } from "lucide-react";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { Sheet } from "@/components/ui/sheet";
import { IconButton } from "@/components/ui/icon-button";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface Props {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  backTo?: string;
  backLabel?: string;
  /** backTo 대신 임의 동작으로 뒤로 갈 때 쓴다 (예: 위저드 단계 되돌리기). */
  onBack?: () => void;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  overflowActions?: MenuItem[];
}

/**
 * 페이지 최상단 헤더. 데스크탑/모바일 분기를 내부에서 처리하므로
 * 페이지는 헤더를 한 번만 선언한다 (스펙 §5).
 */
export function PageHeader({
  title,
  subtitle,
  badge,
  backTo,
  backLabel,
  onBack,
  primaryAction,
  secondaryActions,
  overflowActions,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasOverflow = Boolean(overflowActions && overflowActions.length > 0);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4">
        {(backTo ?? onBack) && (
          onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex w-fit items-center gap-1 rounded-md text-xs text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft size={14} aria-hidden />
              {backLabel ?? t('nav.myEvents')}
            </button>
          ) : (
            <Link
              to={backTo!}
              className="inline-flex w-fit items-center gap-1 rounded-md text-xs text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft size={14} aria-hidden />
              {backLabel ?? t('nav.myEvents')}
            </Link>
          )
        )}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-semibold text-text sm:text-xl">{title}</h1>
              {badge}
            </div>
            {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {primaryAction}
            <span className="hidden items-center gap-2 sm:flex">{secondaryActions}</span>

            {hasOverflow && (
              isDesktop ? (
                <Menu items={overflowActions!} label={t('common.more')} />
              ) : (
                <IconButton aria-label={t('common.more')} onClick={() => setSheetOpen(true)}>
                  <MoreVertical size={18} aria-hidden />
                </IconButton>
              )
            )}
          </div>
        </div>
      </div>

      {hasOverflow && !isDesktop && (
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t('common.more')}>
          {/* 데스크탑 Menu와 같은 role을 쓴다 — 액션의 시맨틱이 뷰포트에 따라 달라지지 않게. */}
          <div role="menu" className="flex flex-col py-1">
            {overflowActions!.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => { item.onClick(); setSheetOpen(false); }}
                className={cn(
                  "flex min-h-touch items-center gap-3 px-4 py-3 text-left text-base transition-colors hover:bg-surface-subtle",
                  item.tone === "danger" && "text-danger",
                  item.tone === "warning" && "text-warning",
                  (!item.tone || item.tone === "default") && "text-text"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </>
  );
}
