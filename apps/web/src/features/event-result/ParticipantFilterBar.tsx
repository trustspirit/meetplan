import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { MatrixModel } from "./matrixModel";

interface Props {
  rows: MatrixModel["rows"];
  participantColors: Record<string, string>;
  hiddenIds: Set<string>;
  onToggleHidden: (id: string) => void;
  onToggleAll: (show: boolean) => void;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}

export function ParticipantFilterBar({
  rows, participantColors, hiddenIds, onToggleHidden, onToggleAll, hoveredId, onHover,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-subtle/60 px-3 py-2.5">
      <button
        type="button"
        onClick={() => onToggleAll(hiddenIds.size > 0)}
        className="min-h-touch rounded-md px-2 text-2xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {hiddenIds.size > 0 ? t('matrix.selectAll') : t('matrix.deselectAll')}
      </button>
      <span className="h-4 w-px bg-border" aria-hidden />
      {rows.map((r) => {
        const color = participantColors[r.responseId] ?? "#888";
        const hidden = hiddenIds.has(r.responseId);
        const hovered = hoveredId === r.responseId;
        return (
          <label
            key={r.responseId}
            className={cn(
              "flex min-h-touch cursor-pointer select-none items-center gap-1.5 rounded-full border-2 px-2.5 text-xs transition-all",
              hidden ? "opacity-40" : "opacity-100"
            )}
            style={{
              borderColor: hovered ? color : "transparent",
              backgroundColor: hovered ? color + "22" : "transparent",
            }}
            onMouseEnter={() => onHover(r.responseId)}
            onMouseLeave={() => onHover(null)}
          >
            <input
              type="checkbox"
              checked={!hidden}
              onChange={() => onToggleHidden(r.responseId)}
              className="h-4 w-4 cursor-pointer"
              style={{ accentColor: color }}
            />
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className={hidden ? "line-through" : ""}>{r.name}</span>
          </label>
        );
      })}
    </div>
  );
}
