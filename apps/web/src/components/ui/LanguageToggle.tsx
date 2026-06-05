import { cn } from "@/lib/utils";
import { getLocale, setLocale, type Locale } from "@/lib/i18n";

interface Props {
  className?: string;
  variant?: "default" | "on-primary";
}

export function LanguageToggle({ className, variant = "default" }: Props) {
  const locale = getLocale();
  const onPrimary = variant === "on-primary";

  const toggle = (next: Locale) => {
    if (next !== locale) setLocale(next);
  };

  return (
    <div
      className={cn(
        "flex text-xs rounded overflow-hidden border",
        onPrimary ? "border-white/40" : "border-border",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => toggle("ko")}
        className={cn(
          "px-2 py-1 transition-colors font-medium",
          onPrimary
            ? locale === "ko"
              ? "bg-white text-primary"
              : "text-white/70 hover:text-white"
            : locale === "ko"
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
          "px-2 py-1 transition-colors font-medium border-l",
          onPrimary ? "border-white/40" : "border-border",
          onPrimary
            ? locale === "en"
              ? "bg-white text-primary"
              : "text-white/70 hover:text-white"
            : locale === "en"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
        )}
      >
        EN
      </button>
    </div>
  );
}
