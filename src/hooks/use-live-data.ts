import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseClientConfigured, supabase } from "@/integrations/supabase/client";

/** Realtime invalidation plus polling for allowlisted viewers without a DB staff role. */
export function useLiveData<T>(
  initial: T,
  fetcher: () => Promise<T>,
  tables: string,
  eventId?: string,
) {
  const [data, setData] = useState<T | null>(initial);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;
  const active = useRef(true);
  const pending = useRef<Promise<void> | null>(null);
  const refresh = useCallback(() => {
    if (pending.current) return pending.current;
    pending.current = fetchRef
      .current()
      .then((next) => {
        if (active.current) {
          setData(next);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (active.current) {
          setData(null);
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not refresh. Check your connection and sign in again.",
          );
        }
      })
      .finally(() => {
        pending.current = null;
      });
    return pending.current;
  }, []);
  useEffect(() => {
    active.current = true;
    const timer = window.setInterval(() => void refresh(), 5000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    const channel = isSupabaseClientConfigured()
      ? supabase.channel(`admin-live-${crypto.randomUUID()}`)
      : null;
    for (const table of tables.split(",")) {
      channel?.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(eventId ? { filter: `event_id=eq.${eventId}` } : {}),
        },
        () => void refresh(),
      );
    }
    channel?.subscribe((status) => {
      if (active.current) setConnected(status === "SUBSCRIBED");
    });
    return () => {
      active.current = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [tables, eventId, refresh]);
  return {
    data,
    error,
    refresh,
    liveLabel: error ? "Connection interrupted" : connected ? "Live" : "Live · 5s refresh",
  };
}
