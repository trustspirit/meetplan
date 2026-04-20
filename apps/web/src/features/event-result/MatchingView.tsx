import type { MatchingResult } from "@meetplan/shared";
import type { MatrixModel } from "./matrixModel";

interface Props {
  matching: MatchingResult;
  model: MatrixModel;
  participantNameById: Record<string, string>;
}

export function MatchingView({ matching, model, participantNameById }: Props) {
  if (matching.totalParticipants === 0) {
    return (
      <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground bg-background">
        응답이 모이면 자동 배정 조합이 표시됩니다
      </div>
    );
  }

  const slotLabelById = Object.fromEntries(
    model.slotColumns.map((c) => [c.slotId, `${c.dateLabel} ${c.timeLabel}`])
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-muted/20 p-4 text-sm">
        <div className="font-semibold">
          최대 {matching.maxSize} / {matching.totalParticipants}명 배정 가능
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          가능한 조합 {matching.matchings.length}개{matching.truncated ? "+" : ""} 표시
          {matching.truncated && " (상위 20개)"}
        </div>
      </div>

      {matching.matchings.map((m, idx) => {
        // Stable key — derive from assignments so reordering doesn't reuse wrong DOM nodes
        const stableKey = Object.entries(m.assignments)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([p, s]) => `${p}:${s}`)
          .join("|") || `empty-${idx}`;
        return (
        <div key={stableKey} className="rounded-xl border bg-background p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            조합 #{idx + 1}
          </div>
          <div className="flex flex-col gap-1.5 text-sm">
            {Object.entries(m.assignments).map(([pid, slotId]) => (
              <div key={pid} className="flex items-center justify-between">
                <span>{participantNameById[pid] ?? pid}</span>
                <span className="text-accent font-medium tabular-nums">
                  {slotLabelById[slotId] ?? slotId}
                </span>
              </div>
            ))}
            {m.unmatched.length > 0 && (
              <div className="pt-2 mt-2 border-t text-[11px] text-muted-foreground">
                미배정: {m.unmatched.map((id) => participantNameById[id] ?? id).join(", ")}
              </div>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}
