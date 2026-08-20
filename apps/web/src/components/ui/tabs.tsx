import { useRef } from "react";
import { cn } from "@/lib/utils";

interface Props<T extends string> {
  items: ReadonlyArray<{ value: T; label: React.ReactNode }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ items, value, onChange, className }: Props<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const move = (delta: number) => {
    const idx = items.findIndex((i) => i.value === value);
    if (idx === -1) return;
    const next = items[(idx + delta + items.length) % items.length]!;
    onChange(next.value);
    refs.current[next.value]?.focus();
  };

  return (
    <div role="tablist" className={cn("flex gap-1 border-b border-border", className)}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => { refs.current[item.value] = el; }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
              if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
            }}
            className={cn(
              "-mb-px min-h-touch px-4 py-2 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-t-md",
              selected
                ? "border-b-2 border-primary font-semibold text-text"
                : "border-b-2 border-transparent text-text-muted hover:text-text"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
