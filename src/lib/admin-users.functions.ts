import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listStaffRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const [members, roles] = await Promise.all([
      context.supabase
        .from("members")
        .select("id, name, slug, user_id, role, is_head")
        .not("user_id", "is", null)
        .order("name"),
      context.supabase.from("user_roles").select("user_id, role"),
    ]);
    return {
      members: (members.data ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        userId: m.user_id!,
        memberRole: m.role,
        isHead: m.is_head,
      })),
      roles: (roles.data ?? []).map((r) => ({ userId: r.user_id, role: r.role })),
    };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "head", "member", "none"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);

    if (data.userId === context.userId && data.role !== "admin") {
      throw new Error("You cannot downgrade your own admin access.");
    }

    const { error: deleteError } = await context.supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (deleteError) throw new Error("Could not update roles.");

    if (data.role !== "none") {
      const { error: insertError } = await context.supabase
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (insertError) throw new Error("Could not save the new role.");
    }
    return { ok: true };
  });
