import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { memberSelfInput, mentorRequestInput } from "@/lib/schemas";

export const myDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadViewer } = await import("@/lib/roles.server");
    const viewer = await loadViewer(context.supabase, context.userId);
    const email = String((context.claims as { email?: string })?.email ?? "").toLowerCase();

    const [teamsRes, badgeRes, catalogRes] = await Promise.all([
      context.supabase.from("teams").select("id, name").order("sort_order"),
      viewer.member
        ? context.supabase
            .from("member_badges")
            .select("badge_id, note, awarded_on")
            .eq("member_id", viewer.member.id)
        : Promise.resolve({
            data: [] as { badge_id: string; note: string | null; awarded_on: string }[],
          }),
      context.supabase.from("badges").select("id, name, description, icon"),
    ]);

    let attendance: {
      event: string;
      date: string;
      checkedInAt: string | null;
      code: string;
    }[] = [];

    if (email) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("event_registrations")
        .select("code, checked_in_at, events(title, event_date)")
        .ilike("email", email)
        .order("created_at", { ascending: false });
      attendance = (data ?? []).map((r) => ({
        event: r.events?.title ?? "Event",
        date: r.events?.event_date ?? "",
        checkedInAt: r.checked_in_at,
        code: r.code,
      }));
    }

    return {
      viewer,
      email,
      teams: teamsRes.data ?? [],
      badges: badgeRes.data ?? [],
      badgeCatalog: catalogRes.data ?? [],
      attendance,
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => memberSelfInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("members")
      .update({
        bio: data.bio,
        skills: data.skills,
        links: data.links,
        photo_url: data.photoUrl,
      })
      .eq("user_id", context.userId);
    if (error) throw new Error("Could not save your profile.");
    return { ok: true };
  });

export const myMentorships = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mentorship_requests")
      .select("id, topic, message, status, created_at, mentee_id, mentor_id")
      .order("created_at", { ascending: false });
    if (error) return [];
    return data ?? [];
  });

export const requestMentor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => mentorRequestInput.parse(input))
  .handler(async ({ data, context }) => {
    const { loadViewer } = await import("@/lib/roles.server");
    const viewer = await loadViewer(context.supabase, context.userId);
    if (!viewer.member) throw new Error("Only listed members can request a mentor.");
    if (viewer.member.id === data.mentorId) throw new Error("Pick someone other than yourself.");
    const { error } = await context.supabase.from("mentorship_requests").insert({
      mentee_id: viewer.member.id,
      mentor_id: data.mentorId,
      topic: data.topic,
      message: data.message,
    });
    if (error) throw new Error("Could not send that request.");
    return { ok: true };
  });

export const respondMentorship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "accepted", "declined", "closed"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("mentorship_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error("Could not update that request.");
    return { ok: true };
  });
