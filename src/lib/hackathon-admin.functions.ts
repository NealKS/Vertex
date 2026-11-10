import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { approvedCsv, rejectedCsv } from "@/lib/hackathon-admin";

export const getHackathonAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireHackathonAccess, allSubmissions } = await import("./hackathon-admin.server");
    const viewer = await requireHackathonAccess(context);
    return { ...(await allSubmissions()), canReview: viewer.isAllowlisted };
  });
export const reviewHackathonSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        note: z.string().trim().max(2000).default(""),
        reconsider: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { reviewSubmission } = await import("./hackathon-admin.server");
    return reviewSubmission(context, data);
  });
export const retryHackathonEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { requireHackathonAccess, deliverReviewEmail } = await import("./hackathon-admin.server");
    await requireHackathonAccess(context);
    return deliverReviewEmail(data.id);
  });
export const exportApprovedSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireHackathonAccess, allSubmissions } = await import("./hackathon-admin.server");
    await requireHackathonAccess(context);
    return approvedCsv((await allSubmissions(true)).rows);
  });
export const getHackathonAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireHackathonAccess, sarvamEventId } = await import("./hackathon-admin.server");
    const viewer = await requireHackathonAccess(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const eventId = await sarvamEventId();
    const { data, error } = await supabaseAdmin
      .from("event_announcements")
      .select("*")
      .eq("event_id", eventId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load announcements.");
    return { items: data, eventId, canEdit: viewer.isAllowlisted };
  });
export const saveHackathonAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().trim().min(2).max(160),
        body: z.string().trim().min(2).max(5000),
        date: z.string().datetime(),
        pinned: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { requireHackathonAccess, sarvamEventId } = await import("./hackathon-admin.server");
    await requireHackathonAccess(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const eventId = await sarvamEventId();
    const row = {
      title: data.title,
      body: data.body,
      pinned: data.pinned,
      created_at: data.date,
      published: true,
    };
    const result = data.id
      ? await supabaseAdmin
          .from("event_announcements")
          .update(row)
          .eq("id", data.id)
          .eq("event_id", eventId)
          .select("id")
          .single()
      : await supabaseAdmin
          .from("event_announcements")
          .insert({ ...row, event_id: eventId })
          .select("id")
          .single();
    if (result.error) throw new Error("Could not save announcement.");
    return { ok: true };
  });
export const deleteHackathonAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { requireHackathonAccess, sarvamEventId } = await import("./hackathon-admin.server");
    await requireHackathonAccess(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const eventId = await sarvamEventId();
    const { error } = await supabaseAdmin
      .from("event_announcements")
      .delete()
      .eq("id", data.id)
      .eq("event_id", eventId)
      .select("id")
      .single();
    if (error) throw new Error("Could not delete announcement.");
    return { ok: true };
  });

export const queueHackathonReconsideration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), queued: z.boolean() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { requireHackathonAccess, fail } = await import("./hackathon-admin.server");
    await requireHackathonAccess(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.rpc("queue_sarvam_reconsideration", {
      p_id: data.id,
      p_queued: data.queued,
    });
    if (result.error)
      throw new Error("Could not update reconsideration. Check the latest migration.");
    if (!result.data) fail(409, "This team is no longer eligible. Refresh the list.");
    return { ok: true };
  });
export const exportReconsideredSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireHackathonAccess, allSubmissions } = await import("./hackathon-admin.server");
    await requireHackathonAccess(context);
    return approvedCsv((await allSubmissions(true)).rows, true);
  });

export const exportRejectedSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireHackathonAccess, allSubmissions } = await import("./hackathon-admin.server");
    await requireHackathonAccess(context);
    return rejectedCsv((await allSubmissions(true)).rows);
  });
