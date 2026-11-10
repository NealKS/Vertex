import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  getJudgingData,
  loadTeamByToken,
  loadTeamByMemberToken,
  checkInHackathonTeam as checkInHackathonTeamServer,
} from "@/lib/hackathon.server";
import {
  hackathonRegisterInput,
  hackathonJoinInput,
  hackathonDeckUploadInput,
  hackathonSubmissionInput,
  hackathonTeamUpdateInput,
  hackathonWorkspaceInput,
  milestoneInput,
  eventAnnouncementInput,
  hackathonProblemStatementInput,
} from "@/lib/schemas";

export const EVENT_SLUG = "sih-internal-hackathon";
const OFFICIAL_SIH_TEAM_SIZE = 6;

const LOCAL_HACKATHON_PREVIEW = {
  event: {
    id: "local-sih-2026",
    slug: EVENT_SLUG,
    title: "SIH Internal Hackathon",
    description: "Local preview of the Vertex SIH Internal Hackathon workspace.",
    location: "REVA University, Bengaluru",
    tag: "SIH 2026",
    event_date: "2026-09-10",
    start_time: "09:00:00",
    schedule_tba: false,
    cover_url: null,
  },
  workspace: {
    registration_open: false,
    submissions_open: false,
    min_team_size: OFFICIAL_SIH_TEAM_SIZE,
    max_team_size: OFFICIAL_SIH_TEAM_SIZE,
    rules: [],
  },
  milestones: [],
  announcements: [],
  showcase: [],
  statements: [],
  roster: [],
};

function shouldUseLocalHackathonPreview() {
  const url = process.env["SUPABASE_URL"] ?? "";
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
  return process.env["NODE_ENV"] !== "production" && (!key || url.includes("<project-ref>"));
}

async function limit(scope: string, limit: number, windowMs: number) {
  const { clientKey, rateLimit, RateLimitError } = await import("@/lib/rate-limit.server");
  try {
    rateLimit(await clientKey(scope, scope), limit, windowMs);
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw new Error(
        `Too many requests from your network. Try again in ${error.retryAfterSeconds}s.`,
      );
    }
    throw error;
  }
}

export const getHackathon = createServerFn({ method: "GET" }).handler(async () => {
  if (shouldUseLocalHackathonPreview()) return LOCAL_HACKATHON_PREVIEW;

  const { serverPublicClient } = await import("@/lib/supabase-public.server");
  const sb = serverPublicClient();

  const { data: event } = await sb
    .from("events")
    .select(
      "id, slug, title, description, location, tag, event_date, start_time, schedule_tba, cover_url",
    )
    .eq("slug", EVENT_SLUG)
    .eq("published", true)
    .maybeSingle();
  if (!event) return null;

  const [workspace, milestones, announcements, submissions, statements] = await Promise.all([
    sb
      .from("event_workspaces")
      .select("registration_open, submissions_open, min_team_size, max_team_size, rules")
      .eq("event_id", event.id)
      .eq("published", true)
      .maybeSingle(),
    sb
      .from("event_milestones")
      .select("id, title, description, starts_at, ends_at, sort_order")
      .eq("event_id", event.id)
      .eq("published", true)
      .order("sort_order"),
    sb
      .from("event_announcements")
      .select("id, title, body, pinned, created_at")
      .eq("event_id", event.id)
      .eq("published", true)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    sb
      .from("hackathon_submissions")
      .select(
        "id, solution_title, solution_summary, theme, problem_statement_title, repository_url, demo_url",
      )
      .eq("published", true),
    sb
      .from("hackathon_problem_statements")
      .select(
        "id, statement_code, title, organization, category, theme, description, source_url, source_version",
      )
      .eq("event_id", event.id)
      .eq("published", true)
      .order("sort_order")
      .order("statement_code"),
  ]);

  // Contact data remains protected by RLS. A server-only query intentionally exposes only
  // names, team names, branch/year, and status for the public roster.
  let roster: Awaited<ReturnType<(typeof import("@/lib/hackathon.server"))["getPublicRoster"]>> =
    [];
  try {
    const { getPublicRoster } = await import("@/lib/hackathon.server");
    roster = await getPublicRoster(event.id);
  } catch (error) {
    console.error("Could not load the public SIH roster", error);
  }

  return {
    event,
    workspace: workspace.data
      ? {
          ...workspace.data,
          // The official SIH 2026 rule overrides older workspace values until the migration
          // is applied to the production database.
          min_team_size: OFFICIAL_SIH_TEAM_SIZE,
          max_team_size: OFFICIAL_SIH_TEAM_SIZE,
        }
      : null,
    milestones: milestones.data ?? [],
    announcements: announcements.data ?? [],
    showcase: submissions.data ?? [],
    statements: statements.data ?? [],
    roster,
  };
});

export const registerHackathonTeam = createServerFn({ method: "POST" })
  .validator((input: unknown) => hackathonRegisterInput.parse(input))
  .handler(async ({ data }) => {
    await limit("sih-register", 5, 60 * 60 * 1000);
    const { createTeam } = await import("@/lib/hackathon.server");
    return createTeam(data);
  });

export const joinHackathonTeam = createServerFn({ method: "POST" })
  .validator((input: unknown) => hackathonJoinInput.parse(input))
  .handler(async ({ data }) => {
    await limit("sih-join", 10, 60 * 60 * 1000);
    const { joinTeam } = await import("@/lib/hackathon.server");
    return joinTeam(data);
  });

export const previewJoinCode = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ code: z.string().trim().min(4).max(20) }).parse(input))
  .handler(async ({ data }) => {
    const { getJoinPreview } = await import("@/lib/hackathon.server");
    return getJoinPreview(data.code);
  });

export const getMyTeamMembership = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ token: z.string().trim().min(10).max(120) }).parse(input),
  )
  .handler(async ({ data }): Promise<ReturnType<typeof loadTeamByMemberToken>> => {
    const { loadTeamByMemberToken } = await import("@/lib/hackathon.server");
    return loadTeamByMemberToken(data.token);
  });

export const updateMyMembership = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        token: z.string().trim().min(10).max(120),
        member: z.object({
          name: z.string().trim().max(100).optional(),
          gender: z.enum(["female", "male", "prefer_not_to_say"]).optional(),
          phone: z.string().trim().max(30).optional(),
          srn: z.string().trim().max(40).optional(),
          branch: z.string().trim().max(80).optional(),
          year: z.string().trim().max(20).optional(),
        }),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await limit("sih-self", 20, 60 * 60 * 1000);
    const { updateOwnMemberEntry } = await import("@/lib/hackathon.server");
    return updateOwnMemberEntry(data.token, data.member);
  });

export const leaveMyTeam = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ token: z.string().trim().min(10).max(120) }).parse(input),
  )
  .handler(async ({ data }) => {
    await limit("sih-leave", 5, 60 * 60 * 1000);
    const { leaveTeam } = await import("@/lib/hackathon.server");
    return leaveTeam(data.token);
  });

export const rotateHackathonJoinCode = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ token: z.string().trim().min(10).max(120) }).parse(input),
  )
  .handler(async ({ data }) => {
    await limit("sih-rotate", 10, 60 * 60 * 1000);
    const { rotateJoinCode } = await import("@/lib/hackathon.server");
    return rotateJoinCode(data.token);
  });

export const getHackathonTeam = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ token: z.string().trim().min(10).max(120) }).parse(input),
  )
  .handler(async ({ data }): Promise<ReturnType<typeof loadTeamByToken>> => {
    const { loadTeamByToken } = await import("@/lib/hackathon.server");
    return loadTeamByToken(data.token);
  });

export const updateHackathonTeam = createServerFn({ method: "POST" })
  .validator((input: unknown) => hackathonTeamUpdateInput.parse(input))
  .handler(async ({ data }) => {
    await limit("sih-update", 30, 60 * 60 * 1000);
    const { updateTeam } = await import("@/lib/hackathon.server");
    return updateTeam(data);
  });

export const saveHackathonSubmission = createServerFn({ method: "POST" })
  .validator((input: unknown) => hackathonSubmissionInput.parse(input))
  .handler(async ({ data }) => {
    await limit("sih-submit", 30, 60 * 60 * 1000);
    const { saveSubmission } = await import("@/lib/hackathon.server");
    return saveSubmission(data);
  });

export const uploadHackathonDeck = createServerFn({ method: "POST" })
  .validator((input: unknown) => hackathonDeckUploadInput.parse(input))
  .handler(async ({ data }) => {
    await limit("sih-deck", 12, 60 * 60 * 1000);
    const { storeSubmissionDeck } = await import("@/lib/hackathon.server");
    return storeSubmissionDeck(data);
  });

export const checkInHackathonTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ code: z.string().trim().min(8).max(240) }).parse(input))
  .handler(async ({ data, context }): Promise<ReturnType<typeof checkInHackathonTeamServer>> => {
    await limit("sih-checkin", 240, 60 * 1000);
    const { assertStaff } = await import("@/lib/roles.server");
    await assertStaff(context.supabase, context.userId);
    const { checkInHackathonTeam: checkIn } = await import("@/lib/hackathon.server");
    return checkIn(data.code, context.userId);
  });

export const hackathonAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff } = await import("@/lib/roles.server");
    await assertStaff(context.supabase, context.userId);
    const { adminOverviewData } = await import("@/lib/hackathon.server");
    return adminOverviewData();
  });

export const reissueHackathonTeamKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ teamId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("@/lib/roles.server");
    await assertStaff(context.supabase, context.userId);
    const { reissueTeamKey } = await import("@/lib/hackathon.server");
    return reissueTeamKey(data.teamId);
  });

export const reopenHackathonSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ teamId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { reopenSubmission } = await import("@/lib/hackathon.server");
    return reopenSubmission(data.teamId);
  });

export const toggleHackathonShowcase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ teamId: z.string().uuid(), published: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("@/lib/roles.server");
    await assertStaff(context.supabase, context.userId);
    const { setShowcase } = await import("@/lib/hackathon.server");
    return setShowcase(data.teamId, data.published);
  });

export const assignHackathonMentor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        teamId: z.string().uuid(),
        mentorName: z.string().trim().max(100),
        mentorEmail: z.string().trim().max(160),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("@/lib/roles.server");
    await assertStaff(context.supabase, context.userId);
    const { assignMentor } = await import("@/lib/hackathon.server");
    return assignMentor(data.teamId, data.mentorName, data.mentorEmail);
  });

export const getJudging = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReturnType<typeof getJudgingData>> => {
    await (await import("@/lib/roles.server")).assertJudge(context.supabase, context.userId);
    const { getJudgingData } = await import("@/lib/hackathon.server");
    return getJudgingData();
  });

export const saveJudgingScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        teamId: z.string().uuid(),
        criterionId: z.string().uuid(),
        score: z.number().min(0).max(1000),
        feedback: z.string().trim().max(2000).optional().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await (await import("@/lib/roles.server")).assertJudge(context.supabase, context.userId);
    const { saveJudgeScore } = await import("@/lib/hackathon.server");
    return saveJudgeScore({ ...data, judgeId: context.userId });
  });

export const saveHackathonWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => hackathonWorkspaceInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { eventId } = await import("@/lib/hackathon.server").then((m) => m.resolveEvent());
    const { error } = await context.supabase
      .from("event_workspaces")
      .update({
        registration_open: data.registrationOpen,
        submissions_open: data.submissionsOpen,
        // SIH 2026 has a fixed, official team size. Do not let an admin control
        // accidentally reopen the old 2–6 team-size setting from seeded data.
        min_team_size: OFFICIAL_SIH_TEAM_SIZE,
        max_team_size: OFFICIAL_SIH_TEAM_SIZE,
        rules: data.rules,
      })
      .eq("event_id", eventId);
    if (error) throw new Error("Could not update the hackathon settings.");
    return { ok: true };
  });

export const saveMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => milestoneInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { eventId } = await import("@/lib/hackathon.server").then((m) => m.resolveEvent());
    const row = {
      event_id: eventId,
      title: data.title,
      description: data.description,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      sort_order: data.sortOrder,
      published: data.published,
    };
    const { error } = data.id
      ? await context.supabase.from("event_milestones").update(row).eq("id", data.id)
      : await context.supabase.from("event_milestones").insert(row);
    if (error) throw new Error("Could not save that milestone.");
    return { ok: true };
  });

export const deleteMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("event_milestones").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete that milestone.");
    return { ok: true };
  });

export const saveEventAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => eventAnnouncementInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { eventId } = await import("@/lib/hackathon.server").then((m) => m.resolveEvent());
    const { error } = await context.supabase.from("event_announcements").insert({
      event_id: eventId,
      title: data.title,
      body: data.body,
      pinned: data.pinned,
      published: data.published,
    });
    if (error) throw new Error("Could not post that update.");
    return { ok: true };
  });

export const saveHackathonProblemStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => hackathonProblemStatementInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { eventId } = await import("@/lib/hackathon.server").then((m) => m.resolveEvent());
    const row = {
      event_id: eventId,
      statement_code: data.statementCode,
      title: data.title,
      organization: data.organization,
      category: data.category,
      theme: data.theme,
      description: data.description,
      source_url: data.sourceUrl,
      source_version: data.sourceVersion,
      published: data.published,
      sort_order: data.sortOrder,
    };
    const { error } = data.id
      ? await context.supabase.from("hackathon_problem_statements").update(row).eq("id", data.id)
      : await context.supabase.from("hackathon_problem_statements").insert(row);
    if (error) throw new Error("Could not save that problem statement.");
    return { ok: true };
  });

export const setHackathonTeamStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "registered",
          "in_review",
          "shortlisted",
          "selected",
          "waitlisted",
          "rejected",
          "withdrawn",
        ]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("@/lib/roles.server");
    await assertStaff(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("hackathon_teams")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error("Could not update that team.");
    return { ok: true };
  });
