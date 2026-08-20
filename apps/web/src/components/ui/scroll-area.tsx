import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useScrollAffordance } from "@/lib/useScrollAffordance";
import { t } from "@/lib/i18n";

interface Props {
  orientation?: "horizontal" | "vertical" | "both";
  /** 아래쪽에 "↓ 더 있음" 텍스트 힌트를 함께 표시한다. */
  hint?: boolean;
  className?: string;
  /** 실제 스크롤되는 내부 요소에 붙는 클래스 (패딩 등). */
  contentClassName?: string;
  children: ReactNode;
}

const FADE = "pointer-events-none absolute z-20 transition-opacity duration-150";

/**
 * 스크롤 컨테이너 래퍼. 더 스크롤할 여지가 있는 가장자리에만 페이드 마스크를 띄운다.
 * 양방향을 독립적으로 판정하므로 "왼쪽으로도 갈 수 있음"이 정확히 표현된다.
 */
export function ScrollArea({
  orientation = "horizontal",
  hint,
  className,
  contentClassName,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const a = useScrollAffordance(ref);

  const horizontal = orientation === "horizontal" || orientation === "both";
  const vertical = orientation === "vertical" || orientation === "both";

  return (
    <div className={cn("relative", className)}>
      {horizontal && a.canScrollLeft && (
        <div className={cn(FADE, "inset-y-0 left-0 w-10 bg-gradient-to-r from-surface to-transparent")} aria-hidden />
      )}
      {horizontal && a.canScrollRight && (
        <div className={cn(FADE, "inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent")} aria-hidden />
      )}
      {vertical && a.canScrollUp && (
        <div className={cn(FADE, "inset-x-0 top-0 h-8 bg-gradient-to-b from-surface to-transparent")} aria-hidden />
      )}
      {vertical && a.canScrollDown && (
        <div className={cn(FADE, "inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface to-transparent")} aria-hidden />
      )}

      <div
        ref={ref}
        className={cn(
          "scroll-visible",
          horizontal && "overflow-x-auto",
          vertical && "overflow-y-auto",
          contentClassName
        )}
      >
        {children}
      </div>

      {hint && a.canScrollDown && (
        <div className="pointer-events-none absolute inset-x-0 bottom-1 z-20 text-center text-2xs text-text-muted">
          {t('common.scrollMore')}
        </div>
      )}
    </div>
  );
}
