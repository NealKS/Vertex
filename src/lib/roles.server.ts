import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

import { isAdminEmail } from "./admin-access.server";

export type Db = SupabaseClient<Database>;

export type Viewer = {
  userId: string;
  roles: string[];
  isAdmin: boolean;
  isAllowlisted: boolean;
  isHead: boolean;
  isJudge: boolean;
  isMentor: boolean;
  headTeams: string[];
  member: {
    id: string;
    slug: string;
    name: string;
    role: string;
    teamId: string | null;
    photoUrl: string | null;
    bio: string | null;
    skills: string[];
    links: Record<string, string>;
  } | null;
};

export async function loadViewer(supabase: Db, userId: string): Promise<Viewer> {
  const [rolesRes, memberRes, authRes] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase
      .from("members")
      .select("id, slug, name, role, team_id, photo_url, bio, skills, links, is_head")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const user = authRes.data.user;
  const isAllowlisted =
    !authRes.error &&
    user?.id === userId &&
    Boolean(user.email_confirmed_at) &&
    isAdminEmail(user.email);
  const roles = (rolesRes.data ?? []).map((r) => String(r.role));
  const m = memberRes.data;

  return {
    userId,
    roles,
    isAdmin: roles.includes("admin") || isAllowlisted,
    isAllowlisted,
    isHead: roles.includes("head") || Boolean(m?.is_head),
    isJudge: roles.includes("judge"),
    isMentor: roles.includes("mentor"),
    headTeams: m?.is_head && m.team_id ? [m.team_id] : [],
    member: m
      ? {
          id: m.id,
          slug: m.slug,
          name: m.name,
          role: m.role,
          teamId: m.team_id,
          photoUrl: m.photo_url,
          bio: m.bio,
          skills: m.skills ?? [],
          links: (m.links as Record<string, string>) ?? {},
        }
      : null,
  };
}

export async function assertAdmin(supabase: Db, userId: string): Promise<Viewer> {
  const viewer = await loadViewer(supabase, userId);
  if (!viewer.isAdmin) throw new Error("Admins only.");
  return viewer;
}

export async function assertStaff(supabase: Db, userId: string): Promise<Viewer> {
  const viewer = await loadViewer(supabase, userId);
  if (!viewer.isAdmin && !viewer.isHead) throw new Error("Team heads and admins only.");
  return viewer;
}

/** Judges, heads, and admins can score; mentors and students cannot. */
export async function assertJudge(supabase: Db, userId: string): Promise<Viewer> {
  const viewer = await loadViewer(supabase, userId);
  if (!viewer.isAdmin && !viewer.isHead && !viewer.isJudge) {
    throw new Error("Judges, team heads, and admins only.");
  }
  return viewer;
}

/** Mentors, heads, and admins. */
export async function assertMentor(supabase: Db, userId: string): Promise<Viewer> {
  const viewer = await loadViewer(supabase, userId);
  if (!viewer.isAdmin && !viewer.isHead && !viewer.isMentor) {
    throw new Error("Mentors, team heads, and admins only.");
  }
  return viewer;
}

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export async function signMediaUrl(supabase: Db, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("media").createSignedUrl(path, TEN_YEARS);
  if (error || !data) throw new Error("Could not prepare the uploaded image.");
  return data.signedUrl;
}
