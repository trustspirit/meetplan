import { useCallback, useState } from "react";

const PREFIX = "meetplan:once:";

function readDismissed(key: string): boolean {
  try {
    return localStorage.getItem(PREFIX + key) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(key: string): void {
  try {
    localStorage.setItem(PREFIX + key, "1");
  } catch {
    // localStorage blocked (Safari private mode, etc.) — silently ignore.
    // The tour will keep appearing but the feature still works.
  }
}

export function useOnce(key: string): { shouldShow: boolean; dismiss: () => void } {
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissed(key));

  const dismiss = useCallback(() => {
    writeDismissed(key);
    setDismissed(true);
  }, [key]);

  return { shouldShow: !dismissed, dismiss };
}
