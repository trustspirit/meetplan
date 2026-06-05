import { cn } from "@/lib/utils";
import { getLocale, setLocale, type Locale } from "@/lib/i18n";

export function LanguageToggle({ className }: { className?: string }) {
  const locale = getLocale();

  const toggle = (next: Locale) => {
    if (next !== locale) setLocale(next);
  };

  return (
    <div className={cn("flex text-xs rounded border border-border overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => toggle("ko")}
        className={cn(
          "px-2 py-1 transition-colors",
          locale === "ko"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        KO
      </button>
      <button
        type="button"
        onClick={() => toggle("en")}
        className={cn(
          "px-2 py-1 border-l border-border transition-colors",
          locale === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        EN
      </button>
    </div>
  );
}
