import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  /** 감싸는 control의 id. label 연결과 aria-describedby 생성에 쓰인다. */
  htmlFor: string;
  hint?: string;
  error?: string;
  /** 라벨 우측 끝에 붙는 보조 요소 (글자 수 카운터 등) */
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Label + control + hint/error 를 한 단위로 묶는다.
 * children의 단일 엘리먼트에 aria-invalid / aria-describedby 를 자동으로 주입한다.
 */
export function Field({ label, htmlFor, hint, error, aside, className, children }: Props) {
  const describedById = `${htmlFor}-desc`;
  const hasDesc = Boolean(error ?? hint);

  const control = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        "aria-invalid": error ? true : undefined,
        "aria-describedby": hasDesc ? describedById : undefined,
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {aside}
      </div>
      {control}
      {error ? (
        <p id={describedById} className="flex items-center gap-1 text-2xs text-danger">
          <AlertCircle size={11} className="shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={describedById} className="text-2xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
