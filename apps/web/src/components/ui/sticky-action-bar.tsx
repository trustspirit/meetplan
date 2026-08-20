import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * 화면 하단에 고정되는 액션 영역.
 * 부모 컨테이너는 이 바 높이만큼 하단 패딩(pb-24 이상)을 가져야 콘텐츠가 가려지지 않는다.
 */
export function StickyActionBar({ children, className }: Props) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur",
        "px-4 py-3 sm:px-6",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        className
      )}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        {children}
      </div>
    </div>
  );
}
