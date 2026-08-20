import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-surface-subtle text-text-muted",
        primary: "bg-primary-subtle text-primary",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        danger: "bg-danger/10 text-danger",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** 앞에 찍히는 상태 점. 상태 표시용 배지에서 색만으로 구분하지 않게 해준다. */
  dot?: boolean;
}

export function Badge({ className, tone, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
