interface Props {
  variant?: "list" | "detail";
  rows?: number;
}

export function PageSkeleton({ variant = "list", rows = 3 }: Props) {
  return (
    <div className="animate-pulse p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-8 bg-muted rounded-lg w-20" />
      </div>

      {variant === "list" ? (
        Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <div className="h-3.5 bg-muted rounded w-40" />
            <div className="h-3 bg-muted/60 rounded w-28" />
          </div>
        ))
      ) : (
        <>
          <div className="flex gap-4 border-b pb-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-4 bg-muted/60 rounded w-20" />
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-6 bg-muted rounded" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
