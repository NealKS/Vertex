import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const listStaffInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("staff_invites")
      .select("id, code, role, label, max_uses, used_count, revoked, created_at")
      .order("created_at", { ascending: false });
    return { invites: data ?? [] };
  });

export const issueStaffInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        role: z.enum(["judge", "mentor"]),
        label: z.string().trim().max(80).optional().default(""),
        maxUses: z.number().int().min(1).max(50).default(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const code =
      data.role.slice(0, 2).toUpperCase() +
      "-" +
      Array.from(
        { length: 6 },
        () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
      ).join("");
    const { error } = await context.supabase.from("staff_invites").insert({
      code,
      role: data.role,
      label: data.label || null,
      max_uses: data.maxUses,
      created_by: context.userId,
    });
    if (error) throw new Error("Could not create the code.");
    return { code };
  });

export const revokeStaffInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("staff_invites")
      .update({ revoked: true })
      .eq("id", data.id);
    if (error) throw new Error("Could not revoke the code.");
    return { ok: true };
  });

export const redeemStaffInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({ code: z.string().trim().min(4).max(20), role: z.enum(["judge", "mentor"]) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Runs with the user's JWT so redeem_staff_invite sees the real auth.uid().
    const { error } = await context.supabase.rpc("redeem_staff_invite", {
      p_code: data.code,
      p_role: data.role,
    });
    if (error) {
      const raw = error.message;
      throw new Error(
        raw.includes("not valid")
          ? "That code is not valid for this role."
          : raw.includes("already been used")
            ? "That code has already been used."
            : "Could not verify that code.",
      );
    }
    return { ok: true };
  });

export const listMentorshipRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("mentorship_requests")
      .select(
        "id, topic, message, status, created_at, mentee_id, mentor_id, members!mentorship_requests_mentee_id_fkey(name), members2:members!mentorship_requests_mentor_id_fkey(name)",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    return {
      requests: (data ?? []).map((r) => {
        const row = r as Record<string, unknown>;
        const mentee = row.members as { name: string } | null;
        const mentor = row.members2 as { name: string } | null;
        return {
          id: row.id as string,
          topic: row.topic as string,
          message: row.message as string | null,
          status: row.status as string,
          createdAt: row.created_at as string,
          mentee: mentee?.name ?? "—",
          mentor: mentor?.name ?? "—",
        };
      }),
    };
  });
