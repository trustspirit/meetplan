import { cn } from "@/lib/utils";
import { getLocale, setLocale, type Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface Props {
  className?: string;
}

export function LanguageToggle({ className }: Props) {
  const locale = getLocale();

  const toggle = (next: Locale) => {
    if (next !== locale) setLocale(next);
  };

  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      className={cn("flex overflow-hidden rounded-md border border-border", className)}
    >
      {(["ko", "en"] as const).map((code, i) => (
        <button
          key={code}
          type="button"
          onClick={() => toggle(code)}
          aria-pressed={locale === code}
          className={cn(
            "px-2.5 py-1.5 text-2xs font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            i > 0 && "border-l border-border",
            locale === code
              ? "bg-primary text-primary-foreground"
              : "bg-surface text-text-muted hover:text-text"
          )}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
