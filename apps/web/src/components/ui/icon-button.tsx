import * as React from "react";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  /** 아이콘만 있는 버튼이므로 접근 가능한 이름이 반드시 필요하다. */
  "aria-label": string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", ...props }, ref) => (
    <Button
      ref={ref}
      size="icon"
      variant={variant}
      className={cn("shrink-0", className)}
      {...props}
    />
  )
);
IconButton.displayName = "IconButton";
