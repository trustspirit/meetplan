import { useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRESETS, clampPeriod, isPreset, nearestPreset } from "./periodPickerUtils";
import { t } from "@/lib/i18n";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function PeriodPicker({ value, onChange }: Props) {
  const [isCustom, setIsCustom] = useState(() => !isPreset(value));
  const [customRaw, setCustomRaw] = useState(() =>
    isPreset(value) ? "" : String(value)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePreset = (p: number) => {
    setIsCustom(false);
    setCustomRaw("");
    onChange(p);
  };

  const handleCustomOpen = () => {
    setIsCustom(true);
    setCustomRaw(isPreset(value) ? "" : String(value));
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCustomBlur = () => {
    const parsed = parseInt(customRaw, 10);
    if (isNaN(parsed) || customRaw.trim() === "") {
      setCustomRaw(String(value));
      return;
    }
    const clamped = clampPeriod(parsed);
    setCustomRaw(String(clamped));
    onChange(clamped);
  };

  const handleCustomClose = () => {
    setIsCustom(false);
    setCustomRaw("");
    onChange(nearestPreset(value));
  };

  const btnBase = cn(
    "h-11 px-4 rounded-md text-sm border transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  );
  const btnActive = "bg-primary text-primary-foreground border-primary";
  const btnIdle = "bg-surface border-border hover:bg-surface-subtle";

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {PRESETS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => handlePreset(p)}
          className={cn(btnBase, !isCustom && value === p ? btnActive : btnIdle)}
        >
          {p}{t('period.suffix')}
        </button>
      ))}

      {isCustom ? (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="number"
            min={5}
            max={180}
            inputMode="numeric"
            value={customRaw}
            onChange={(e) => setCustomRaw(e.target.value)}
            onBlur={handleCustomBlur}
            placeholder={t('period.placeholder')}
            className={cn(
              "h-11 w-16 px-2 rounded-md text-base border text-center",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "border-primary bg-primary/5",
              "[appearance:textfield]",
              "[&::-webkit-outer-spin-button]:appearance-none",
              "[&::-webkit-inner-spin-button]:appearance-none"
            )}
          />
          <span className="text-sm text-text-muted">{t('period.suffix')}</span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCustomClose}
            className="min-h-touch min-w-touch flex items-center justify-center text-text-muted hover:text-text rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t('period.customClose')}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleCustomOpen}
          className={cn(btnBase, btnIdle)}
        >
          {t('period.custom')}
        </button>
      )}
    </div>
  );
}
