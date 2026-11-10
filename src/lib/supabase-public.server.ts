import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function isSupabasePublicConfigured(): boolean {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  return Boolean(
    url &&
      key &&
      typeof url === "string" &&
      typeof key === "string" &&
      key.trim().length > 0 &&
      !url.includes("<project-ref>") &&
      !url.includes("placeholder") &&
      !url.includes("<") &&
      !url.includes(">") &&
      url.startsWith("https://"),
  );
}

function createPublicStubClient() {
  const emptyListPromise = Promise.resolve({ data: [], error: null });

  const chainable = () => {
    const builder: Record<string, unknown> = {
      then: (onfulfilled: (value: unknown) => unknown) => emptyListPromise.then(onfulfilled),
      catch: (onrejected: (reason: unknown) => unknown) => emptyListPromise.catch(onrejected),
    };
    const methods = [
      "select",
      "insert",
      "update",
      "delete",
      "upsert",
      "eq",
      "neq",
      "gt",
      "gte",
      "lt",
      "lte",
      "like",
      "ilike",
      "is",
      "in",
      "contains",
      "containedBy",
      "order",
      "limit",
      "range",
      "single",
      "maybeSingle",
    ];
    for (const m of methods) {
      builder[m] = () => builder;
    }
    return builder;
  };

  return {
    from: () => chainable(),
  } as unknown as SupabaseClient<Database>;
}

export function serverPublicClient(): SupabaseClient<Database> {
  if (!isSupabasePublicConfigured()) {
    return createPublicStubClient();
  }

  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}
