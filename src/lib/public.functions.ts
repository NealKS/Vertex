import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// These are public, working repositories chosen for the first Vertex showcase.
// They are deliberately kept separate from club-contributed database projects so
// the site never assigns team credit that has not been recorded.
const SELECTED_INDEPENDENT_WORK = [
  {
    id: "selected-guardrails",
    slug: "guardrails",
    title: "GuardRails",
    description:
      "A security-first developer environment that brings code scanning into the editing loop.",
    tech: ["TypeScript", "VS Code", "Security"],
    cover_url: null,
    link: "https://github.com/preethamak/GuardRails-IDE",
    year: 2026,
  },
  {
    id: "selected-vyper-guard",
    slug: "vyper-guard",
    title: "Vyper Guard",
    description: "Static analysis tooling for finding security issues in Vyper smart contracts.",
    tech: ["Python", "Vyper", "Static analysis"],
    cover_url: null,
    link: "https://github.com/preethamak/vyper",
    year: 2026,
  },
  {
    id: "selected-codelab",
    slug: "codelab",
    title: "CodeLab",
    description:
      "A browser-based coding evaluation platform with isolated execution and assessment workflows.",
    tech: ["React", "FastAPI", "Docker"],
    cover_url: null,
    link: "https://github.com/preethamak/CodeLab1",
    year: 2025,
  },
] as const;

export const getAnnouncements = createServerFn({ method: "GET" }).handler(async () => {
  const { isSupabasePublicConfigured, serverPublicClient } =
    await import("@/lib/supabase-public.server");
  if (!isSupabasePublicConfigured()) {
    return { items: [], teams: [] };
  }
  try {
    const sb = serverPublicClient();
    const [feed, teams, hackathon] = await Promise.all([
      sb
        .from("announcements")
        .select("id, title, body, team_id, pinned, media_url, media_type, created_at")
        .eq("published", true)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60),
      sb.from("teams").select("id, name").order("sort_order"),
      sb
        .from("event_announcements")
        .select("id,title,body,pinned,created_at,events!inner(slug)")
        .eq("published", true)
        .eq("events.slug", "build-with-sarvam")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60),
    ]);
    if (feed.error || teams.error || hackathon.error)
      throw new Error("Could not load announcements.");
    const items = [
      ...(feed.data ?? []),
      ...(hackathon.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        pinned: row.pinned,
        created_at: row.created_at,
        team_id: "sarvam",
        media_url: null,
        media_type: null,
      })),
    ].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at),
    );
    return { items, teams: [{ id: "sarvam", name: "Vertex × Sarvam AI" }, ...(teams.data ?? [])] };
  } catch {
    throw new Error("Could not load announcements. Please try again.");
  }
});

export const getShowcase = createServerFn({ method: "GET" }).handler(async () => {
  const { isSupabasePublicConfigured, serverPublicClient } =
    await import("@/lib/supabase-public.server");
  if (!isSupabasePublicConfigured()) {
    return {
      projects: [...SELECTED_INDEPENDENT_WORK],
      contributors: [],
      members: [],
      teams: [],
    };
  }
  try {
    const sb = serverPublicClient();
    const [projects, contributors, members, teams] = await Promise.all([
      sb
        .from("projects")
        .select("id, slug, title, description, tech, cover_url, link, year")
        .eq("published", true)
        .order("year", { ascending: false }),
      sb.from("project_contributors").select("project_id, member_id"),
      sb.from("members").select("id, slug, name, role, team_id, photo_url"),
      sb.from("teams").select("id, name").order("sort_order"),
    ]);
    return {
      projects: [...(projects.data ?? []), ...SELECTED_INDEPENDENT_WORK],
      contributors: contributors.data ?? [],
      members: members.data ?? [],
      teams: teams.data ?? [],
    };
  } catch {
    return {
      projects: [...SELECTED_INDEPENDENT_WORK],
      contributors: [],
      members: [],
      teams: [],
    };
  }
});

export const getMemberExtras = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ slug: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const { isSupabasePublicConfigured, serverPublicClient } =
      await import("@/lib/supabase-public.server");
    if (!isSupabasePublicConfigured()) {
      return { badges: [], achievements: [], projects: [] };
    }
    try {
      const sb = serverPublicClient();
      const { data: member } = await sb
        .from("members")
        .select("id")
        .eq("slug", data.slug)
        .maybeSingle();
      if (!member) return { badges: [], achievements: [], projects: [] };

      const [badgeRows, achievements, contributions] = await Promise.all([
        sb
          .from("member_badges")
          .select("badge_id, note, awarded_on, badges(name, description, icon)")
          .eq("member_id", member.id),
        sb
          .from("achievements")
          .select("id, title, description, happened_on")
          .eq("member_id", member.id)
          .order("happened_on", { ascending: false }),
        sb
          .from("project_contributors")
          .select("projects(id, slug, title, year, published)")
          .eq("member_id", member.id),
      ]);

      return {
        badges: (badgeRows.data ?? []).map((b) => ({
          id: b.badge_id,
          name: b.badges?.name ?? b.badge_id,
          description: b.badges?.description ?? null,
          icon: b.badges?.icon ?? "award",
          note: b.note,
          awardedOn: b.awarded_on,
        })),
        achievements: achievements.data ?? [],
        projects: (contributions.data ?? [])
          .map((c) => c.projects)
          .filter(
            (
              p,
            ): p is {
              id: string;
              slug: string;
              title: string;
              year: number | null;
              published: boolean;
            } => Boolean(p && p.published),
          ),
      };
    } catch {
      return { badges: [], achievements: [], projects: [] };
    }
  });

export const getMentorPool = createServerFn({ method: "GET" }).handler(async () => {
  const { isSupabasePublicConfigured, serverPublicClient } =
    await import("@/lib/supabase-public.server");
  if (!isSupabasePublicConfigured()) {
    return { members: [], teams: [] };
  }
  try {
    const sb = serverPublicClient();
    const [members, teams] = await Promise.all([
      sb
        .from("members")
        .select("id, slug, name, role, team_id, photo_url, skills, bio, is_head, is_leadership")
        .order("sort_order"),
      sb.from("teams").select("id, name").order("sort_order"),
    ]);
    return { members: members.data ?? [], teams: teams.data ?? [] };
  } catch {
    return { members: [], teams: [] };
  }
});
