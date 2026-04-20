import { useEffect, useState } from "react";
import type { GetResponseOutput } from "@meetplan/shared";
import { getResponseCallable } from "@/lib/callable";
import { useAuth } from "@/features/auth/useAuth";

export interface ExistingResponseState {
  loading: boolean;
  response: GetResponseOutput["response"] | null;
  error: string | null;
}

export function useExistingResponse(
  eventId: string | undefined,
  rid: string | null,
  token: string | null
): ExistingResponseState {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<ExistingResponseState>({
    loading: true, response: null, error: null,
  });

  useEffect(() => {
    if (!eventId || authLoading) return;

    const hasToken = !!(rid && token);
    const hasAuth = !!user;
    if (!hasToken && !hasAuth) {
      setState({ loading: false, response: null, error: null });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await getResponseCallable({
          eventId,
          ...(hasToken ? { rid: rid!, token: token! } : {}),
        });
        if (cancelled) return;
        if (data.found && data.response) {
          setState({ loading: false, response: data.response, error: null });
        } else {
          setState({ loading: false, response: null, error: null });
        }
      } catch (e) {
        if (cancelled) return;
        setState({
          loading: false, response: null,
          error: e instanceof Error ? e.message : "failed to load response",
        });
      }
    })();

    return () => { cancelled = true; };
  }, [eventId, rid, token, user, authLoading]);

  return state;
}
