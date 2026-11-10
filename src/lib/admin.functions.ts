import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  announcementInput,
  badgeAwardInput,
  eventInput,
  memberInput,
  projectInput,
} from "@/lib/schemas";

export const getViewer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadViewer } = await import("@/lib/roles.server");
    return loadViewer(context.supabase, context.userId);
  });

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireHackathonAccess } = await import("@/lib/hackathon-admin.server");
    const viewer = await requireHackathonAccess(context);
    const sb = viewer.isAllowlisted
      ? (await import("@/integrations/supabase/client.server")).supabaseAdmin
      : context.supabase;

    if (!viewer.isAdmin && !viewer.isHead && !viewer.isJudge) {
      const { data: user } = await sb.auth.getUser();
      const email = user.user?.email?.trim().toLowerCase();
      if (!email) throw new Error("This console is for event staff only.");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const [access, workshopAccess] = await Promise.all([
        supabaseAdmin
          .from("event_staff_access")
          .select("event_id")
          .eq("email", email)
          .eq("active", true),
        supabaseAdmin
          .from("neural_network_workshop_staff")
          .select("permission")
          .eq("email", email)
          .eq("active", true)
          .maybeSingle(),
      ]);
      const eventIds = (access.data ?? []).map((row) => row.event_id);
      if (access.error || (!workshopAccess.data && eventIds.length === 0)) {
        throw new Error("This console is for event staff only.");
      }
      const { data: deskEvents } = eventIds.length
        ? await supabaseAdmin.from("events").select("*").in("id", eventIds).order("event_date")
        : { data: [] as any[] };
      return {
        viewer,
        eventDesk: true,
        deskScope: workshopAccess.data ? ("workshop" as const) : ("generic" as const),
        eventDeskPermission: workshopAccess.data?.permission ?? "checkin",
        applications: [],
        members: [],
        teams: [],
        projects: [],
        announcements: [],
        registrations: [],
        events: (deskEvents ?? []).map((event) => ({ ...event, operations: null })),
        workshopRegistrations: [],
      };
    }

    // Judges get their own console; they never see club data.
    if (!viewer.isAdmin && !viewer.isHead) {
      return {
        viewer,
        eventDesk: false,
        deskScope: null,
        eventDeskPermission: null,
        workshopRegistrations: [],
        applications: [],
        members: [],
        teams: [],
        events: [],
        projects: [],
        announcements: [],
        registrations: [],
      };
    }

    const [
      apps,
      members,
      teams,
      events,
      eventOperations,
      projects,
      announcements,
      regs,
      workshopRegs,
    ] = await Promise.all([
      sb.from("applications").select("*").order("created_at", { ascending: false }),
      sb.from("members").select("*").order("sort_order"),
      sb.from("teams").select("*").order("sort_order"),
      sb.from("events").select("*").order("event_date", { ascending: false }),
      sb.from("event_operation_settings").select("*"),
      sb.from("projects").select("*").order("year", { ascending: false }),
      sb.from("announcements").select("*").order("created_at", { ascending: false }),
      sb
        .from("event_registrations")
        .select(
          "id, event_id, name, email, usn, code, status, checked_in_at, created_at, form_data",
        )
        .order("created_at", { ascending: false }),
      viewer.isAdmin
        ? sb.from("neural_network_workshop_registrations").select("status, checked_in_at")
        : Promise.resolve({ data: [] }),
    ]);

    return {
      viewer,
      eventDesk: false,
      deskScope: null,
      eventDeskPermission: null,
      applications: apps.data ?? [],
      members: members.data ?? [],
      teams: teams.data ?? [],
      events: (events.data ?? []).map((event) => ({
        ...event,
        operations:
          (eventOperations.data ?? []).find((settings) => settings.event_id === event.id) ?? null,
      })),
      projects: projects.data ?? [],
      announcements: announcements.data ?? [],
      registrations: regs.data ?? [],
      workshopRegistrations: workshopRegs.data ?? [],
    };
  });

export const setApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "shortlisted", "accepted", "rejected"]),
        notes: z.string().trim().max(2000).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("applications")
      .update({ status: data.status, notes: data.notes })
      .eq("id", data.id);
    if (error) throw new Error("Could not update that application.");
    return { ok: true };
  });

export const saveMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => memberInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const row = {
      slug: data.slug,
      name: data.name,
      role: data.role,
      team_id: data.teamId,
      is_head: data.isHead,
      is_leadership: data.isLeadership,
      photo_url: data.photoUrl,
      bio: data.bio,
      skills: data.skills,
      links: data.links,
      sort_order: data.sortOrder,
    };
    const query = data.id
      ? context.supabase.from("members").update(row).eq("id", data.id)
      : context.supabase.from("members").insert(row);
    const { error } = await query;
    if (error) {
      throw new Error(
        error.code === "23505"
          ? "A member with that link name already exists."
          : "Could not save the member.",
      );
    }
    return { ok: true };
  });

export const deleteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("members").delete().eq("id", data.id);
    if (error) throw new Error("Could not remove that member.");
    return { ok: true };
  });

export const saveEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => eventInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const row = {
      slug: data.slug,
      title: data.title,
      event_date: data.eventDate,
      start_time: data.startTime,
      location: data.location,
      tag: data.tag,
      description: data.description,
      cover_url: data.coverUrl,
      capacity: data.capacity,
      published: data.published,
    };
    const result = data.id
      ? await context.supabase.from("events").update(row).eq("id", data.id).select("id").single()
      : await context.supabase.from("events").insert(row).select("id").single();
    if (result.error || !result.data) {
      throw new Error(
        result.error?.code === "23505"
          ? "That event already exists — same link name, or same title on the same date."
          : "Could not save the event.",
      );
    }
    const { error: settingsError } = await context.supabase
      .from("event_operation_settings")
      .upsert({
        event_id: result.data.id,
        registration_mode: data.operations.registrationMode,
        registration_open: data.operations.registrationOpen,
        registration_opens_at: data.operations.registrationOpensAt,
        registration_closes_at: data.operations.registrationClosesAt,
        requires_approval: data.operations.requiresApproval,
        waitlist_enabled: data.operations.waitlistEnabled,
        passes_enabled: data.operations.passesEnabled,
        checkin_enabled: data.operations.checkinEnabled,
        email_enabled: data.operations.emailEnabled,
        team_min_size: data.operations.teamMinSize,
        team_max_size: data.operations.teamMaxSize,
        submissions_enabled: data.operations.submissionsEnabled,
        judging_enabled: data.operations.judgingEnabled,
      });
    if (settingsError)
      throw new Error("Event saved, but its operating settings could not be saved.");
    return { ok: true };
  });

export const saveProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => projectInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const row = {
      slug: data.slug,
      title: data.title,
      description: data.description,
      tech: data.tech,
      cover_url: data.coverUrl,
      link: data.link,
      year: data.year,
      published: data.published,
    };
    const res = data.id
      ? await context.supabase.from("projects").update(row).eq("id", data.id).select("id").single()
      : await context.supabase.from("projects").insert(row).select("id").single();
    if (res.error || !res.data) {
      throw new Error(
        res.error?.code === "23505"
          ? "A project with that link name already exists."
          : "Could not save the project.",
      );
    }
    const projectId = res.data.id;
    await context.supabase.from("project_contributors").delete().eq("project_id", projectId);
    if (data.contributorIds.length > 0) {
      await context.supabase
        .from("project_contributors")
        .insert(
          data.contributorIds.map((memberId) => ({ project_id: projectId, member_id: memberId })),
        );
    }
    return { ok: true };
  });

export const saveAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => announcementInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("@/lib/roles.server");
    const viewer = await assertStaff(context.supabase, context.userId);
    if (!viewer.isAdmin && (data.mediaUrl || data.mediaType)) {
      throw new Error("Only admins can attach media to announcements.");
    }
    if (!viewer.isAdmin && (!data.teamId || !viewer.headTeams.includes(data.teamId))) {
      throw new Error("Heads can only post to their own team.");
    }
    const row = {
      title: data.title,
      body: data.body,
      team_id: data.teamId,
      pinned: data.pinned,
      published: data.published,
      media_url: data.mediaUrl,
      media_type: data.mediaType,
      author_id: context.userId,
    };
    const query = data.id
      ? context.supabase.from("announcements").update(row).eq("id", data.id)
      : context.supabase.from("announcements").insert(row);
    const { error } = await query;
    if (error) throw new Error("Could not post that announcement.");
    return { ok: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete that announcement.");
    return { ok: true };
  });

export const checkInByCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ code: z.string().trim().min(4).max(200) }).parse(input))
  .handler(async ({ data, context }) => {
    const code = data.code.trim().split("/").pop() ?? data.code.trim();
    // Event-scoped volunteers have no direct attendee-table access under RLS.
    // Resolve the event server-side, then authorize before returning any attendee data.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: reg, error } = await supabaseAdmin
      .from("event_registrations")
      .select("id, name, status, checked_in_at, event_id, events(title, event_date)")
      .eq("code", code)
      .maybeSingle();
    if (error || !reg || reg.status !== "approved") return { status: "invalid" as const };

    await requireEventDeskAccess(context, reg.event_id, ["manager", "checkin"]);
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("event_operation_settings")
      .select("checkin_enabled")
      .eq("event_id", reg.event_id)
      .maybeSingle();
    if (settingsError || settings?.checkin_enabled === false) {
      throw new Error("Check-in is currently unavailable for this event.");
    }
    if (reg.checked_in_at) {
      return {
        status: "already" as const,
        name: reg.name,
        event: reg.events?.title ?? "",
        at: reg.checked_in_at,
      };
    }
    const at = new Date().toISOString();
    const { data: updated, error: upErr } = await supabaseAdmin
      .from("event_registrations")
      .update({ checked_in_at: at, checked_in_by: context.userId })
      .eq("id", reg.id)
      .eq("status", "approved")
      .is("checked_in_at", null)
      .select("id");
    if (upErr) throw new Error("Could not record that check-in.");
    if (!updated?.length) {
      const { data: latest, error: latestError } = await supabaseAdmin
        .from("event_registrations")
        .select("status, checked_in_at")
        .eq("id", reg.id)
        .single();
      if (latestError) throw new Error("Could not confirm that check-in.");
      if (latest.status !== "approved" || !latest.checked_in_at)
        return { status: "invalid" as const };
      return {
        status: "already" as const,
        name: reg.name,
        event: reg.events?.title ?? "",
        at: latest.checked_in_at,
      };
    }
    return { status: "ok" as const, name: reg.name, event: reg.events?.title ?? "", at };
  });

type EventStaffAccess = {
  id: string;
  event_id: string;
  email: string;
  permission: "manager" | "checkin" | "viewer";
  active: boolean;
  created_at: string;
};

async function eventPermission(context: { supabase: any; userId: string }, eventId: string) {
  const { loadViewer } = await import("@/lib/roles.server");
  const viewer = await loadViewer(context.supabase, context.userId);
  if (viewer.isAdmin || viewer.isHead) return "manager" as const;
  const { data: user } = await context.supabase.auth.getUser();
  const email = user.user?.email?.trim().toLowerCase();
  if (!email) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("event_staff_access")
    .select("permission")
    .eq("event_id", eventId)
    .eq("email", email)
    .eq("active", true)
    .maybeSingle();
  return (data?.permission as EventStaffAccess["permission"] | undefined) ?? null;
}

async function requireEventDeskAccess(
  context: { supabase: any; userId: string },
  eventId: string,
  levels: EventStaffAccess["permission"][],
) {
  const permission = await eventPermission(context, eventId);
  if (!permission || !levels.includes(permission)) {
    throw new Error("You do not have check-in access for this event.");
  }
  return permission;
}

export const listEventStaffAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ eventId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<EventStaffAccess[]> => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("event_staff_access")
      .select("id, event_id, email, permission, active, created_at")
      .eq("event_id", data.eventId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load event staff access.");
    return (rows ?? []) as EventStaffAccess[];
  });

export const saveEventStaffAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        eventId: z.string().uuid(),
        email: z.string().trim().email().max(160),
        permission: z.enum(["manager", "checkin", "viewer"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("event_staff_access").upsert(
      {
        event_id: data.eventId,
        email: data.email.toLowerCase(),
        permission: data.permission,
        active: true,
        created_by: context.userId,
      },
      { onConflict: "event_id,email" },
    );
    if (error) throw new Error("Could not save event access.");
    return { ok: true };
  });

export const revokeEventStaffAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("event_staff_access")
      .update({ active: false })
      .eq("id", data.id);
    if (error) throw new Error("Could not revoke event access.");
    return { ok: true };
  });

export const setEventRegistrationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected", "waitlisted"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: registration, error: lookupError } = await supabaseAdmin
      .from("event_registrations")
      .select("id, event_id, name, email, status, form_data")
      .eq("id", data.id)
      .single();
    if (lookupError || !registration) throw new Error("Could not find that registration.");

    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("slug")
      .eq("id", registration.event_id)
      .maybeSingle();
    if (eventError) throw new Error("Could not identify that registration's event.");

    if (event?.slug === "build-with-sarvam") {
      const { reviewSubmission, fail } = await import("./hackathon-admin.server");
      if (data.status === "waitlisted")
        return fail(400, "Sarvam submissions can only be approved or rejected.");
      return reviewSubmission(context, { id: data.id, status: data.status, note: "" });
    }

    const { error } = await context.supabase
      .from("event_registrations")
      .update({
        status: data.status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error("Could not update that registration.");

    return { ok: true, emailSent: false };
  });

export const awardBadge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => badgeAwardInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("member_badges")
      .upsert({ member_id: data.memberId, badge_id: data.badgeId, note: data.note });
    if (error) throw new Error("Could not award that badge.");
    return { ok: true };
  });

export const revokeBadge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ memberId: z.string().uuid(), badgeId: z.string().min(1).max(60) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("member_badges")
      .delete()
      .eq("member_id", data.memberId)
      .eq("badge_id", data.badgeId);
    if (error) throw new Error("Could not remove that badge.");
    return { ok: true };
  });

export const finalizeUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ path: z.string().trim().min(3).max(400) }).parse(input))
  .handler(async ({ data }) => {
    return { url: `/api/public/media/${data.path}`, path: data.path };
  });

export const uploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        folder: z
          .string()
          .trim()
          .regex(/^[a-z0-9-]{2,40}$/),
        ext: z
          .string()
          .trim()
          .regex(/^[a-z0-9]{2,5}$/),
        contentType: z
          .string()
          .trim()
          .regex(/^image\/[a-z0-9.+-]{2,20}$/),
        base64: z.string().min(16).max(14_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const binary = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (binary.byteLength > 8 * 1024 * 1024) throw new Error("That image is too large.");
    const path = `${data.folder}/${crypto.randomUUID()}.${data.ext}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from("media").upload(path, binary, {
      contentType: data.contentType,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error("Could not store that image.");
    return { url: `/api/public/media/${path}`, path };
  });

export const uploadAnnouncementMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        ext: z
          .string()
          .trim()
          .regex(/^[a-z0-9]{2,5}$/),
        contentType: z
          .string()
          .trim()
          .regex(/^(image|video)\/[a-z0-9.+-]{2,20}$/),
        base64: z.string().min(16).max(34_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/roles.server");
    await assertAdmin(context.supabase, context.userId);
    const binary = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (binary.byteLength > 24 * 1024 * 1024)
      throw new Error("That file is too large (24 MB max).");
    const path = `announcements/${crypto.randomUUID()}.${data.ext}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from("media").upload(path, binary, {
      contentType: data.contentType,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error("Could not store that media file.");
    return { url: `/api/public/media/${path}`, path };
  });
