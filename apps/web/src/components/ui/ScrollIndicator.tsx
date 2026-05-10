import { useEffect, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";

interface Props {
  containerRef: RefObject<HTMLDivElement>;
  columnWidth: number;
  total: number;
}

export function ScrollIndicator({ containerRef, columnWidth, total }: Props) {
  const [startIdx, setStartIdx] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { scrollLeft, clientWidth, scrollWidth } = el;
      setStartIdx(Math.floor(scrollLeft / columnWidth));
      setHasMore(scrollLeft + clientWidth < scrollWidth - 2);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [containerRef, columnWidth]);

  if (total <= 3) return null;

  const visibleCount = containerRef.current
    ? Math.floor(containerRef.current.clientWidth / columnWidth)
    : 1;

  return (
    <div className="flex justify-center items-center gap-1 mt-2">
      {Array.from({ length: total }).map((_, i) => {
        const active = i >= startIdx && i < startIdx + visibleCount;
        return (
          <div
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-200",
              active ? "w-4 bg-primary" : "w-2 bg-muted-foreground/30"
            )}
          />
        );
      })}
      {hasMore && (
        <span className="text-[10px] text-muted-foreground ml-1">→</span>
      )}
    </div>
  );
}
