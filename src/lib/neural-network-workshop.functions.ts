import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  NEURAL_NETWORK_ATTEND_REASONS,
  NEURAL_NETWORK_WORKSHOP_YEARS,
} from "@/data/neural-network-workshop";

const attendReason = z.enum(NEURAL_NETWORK_ATTEND_REASONS);
const registrationInput = z.object({
  name: z.string().trim().min(1).max(100),
  srn: z.string().trim().min(1).max(40),
  department: z.string().trim().min(1).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  email: z.string().trim().email().max(160),
  year: z.enum(NEURAL_NETWORK_WORKSHOP_YEARS),
  attendReason: z.array(attendReason).min(1).max(2),
  expectation: z.string().trim().min(1).max(3000),
});

export type NeuralNetworkWorkshopRegistration = {
  id: string;
  name: string;
  srn: string;
  department: string;
  phone: string;
  email: string;
  year: string;
  attend_reason: string;
  expectation: string;
  qr_token: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  checked_in_at: string | null;
  pass_sent_at: string | null;
  activity: WorkshopRegistrationActivity[];
};
export type WorkshopRegistrationActivity = {
  action: "approved" | "rejected" | "pass_sent" | "pass_resent";
  created_at: string;
};
export type WorkshopStaff = {
  id: string;
  email: string;
  permission: "manager" | "checkin" | "viewer";
  active: boolean;
  created_at: string;
};

const codeValue = (token: string) => `VTX-NN:${token}`;
const passUrl = (token: string) =>
  `${process.env["SITE_URL"] ?? "https://vertex-club.vercel.app"}/passes/neural-networks-from-scratch/${token}`;

function normalizeWorkshopPassCode(value: string) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).pathname.split("/").filter(Boolean).at(-1) ?? "";
    } catch {
      return "";
    }
  }
  return trimmed.replace(/^VTX-NN:/i, "");
}

export const registerForNeuralNetworkWorkshop = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registrationInput.parse(input))
  .handler(async ({ data }) => {
    const { clientKey, rateLimit, RateLimitError } = await import("@/lib/rate-limit.server");
    try {
      rateLimit(await clientKey("neural-network-workshop", "registration"), 5, 60 * 60 * 1000);
    } catch (error) {
      if (error instanceof RateLimitError)
        throw new Error(
          `Too many registration attempts. Try again in ${error.retryAfterSeconds}s.`,
        );
      throw error;
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("neural_network_workshop_registrations")
      .insert({
        name: data.name,
        srn: data.srn.toUpperCase(),
        department: data.department,
        phone: data.phone,
        email: data.email.toLowerCase(),
        year: data.year,
        attend_reason: data.attendReason.join(" | "),
        expectation: data.expectation,
        // A registration is an application, not an entry pass. The event manager
        // approves it from the admin console before a QR can exist or be emailed.
        status: "pending",
      })
      .select("id, status")
      .single();
    if (error?.code === "23505")
      throw new Error("You have already registered for this workshop with this SRN.");
    if (error) throw new Error("Could not save your registration. Please try again.");

    let receiptEmailSent = false;
    try {
      const { sendWorkshopRegistrationEmail } = await import("@/lib/workshop-email.server");
      receiptEmailSent = await sendWorkshopRegistrationEmail({
        name: data.name,
        email: data.email.toLowerCase(),
        registrationId: row.id,
      });
    } catch (emailError) {
      // Registration is already saved. A receipt-email problem must not make
      // the participant submit again or make the successful registration fail.
      console.error("Could not send workshop registration receipt", emailError);
    }

    return { ok: true, status: row.status as "pending", receiptEmailSent };
  });

async function currentEmail(context: { supabase: any }) {
  const { data } = await context.supabase.auth.getUser();
  return data.user?.email?.trim().toLowerCase() ?? "";
}
async function workshopPermission(context: { supabase: any; userId: string }) {
  const { loadViewer } = await import("@/lib/roles.server");
  const viewer = await loadViewer(context.supabase, context.userId);
  if (viewer.isAdmin) return "manager" as const;
  const email = await currentEmail(context);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("neural_network_workshop_staff")
    .select("permission")
    .eq("email", email)
    .eq("active", true)
    .maybeSingle();
  return data?.permission ?? null;
}
async function requireWorkshopAccess(context: { supabase: any; userId: string }, levels: string[]) {
  const permission = await workshopPermission(context);
  if (!permission || !levels.includes(permission))
    throw new Error("You do not have access to this workshop operation.");
  return permission;
}

async function requireClubAdmin(context: { supabase: any; userId: string }) {
  const { loadViewer } = await import("@/lib/roles.server");
  const viewer = await loadViewer(context.supabase, context.userId);
  if (!viewer.isAdmin) throw new Error("Only club admins can manage event-desk access.");
  return viewer;
}

async function recordRegistrationActivity(
  registrationId: string,
  action: WorkshopRegistrationActivity["action"],
  actorId: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("neural_network_workshop_registration_activity")
    .insert({
      registration_id: registrationId,
      action,
      actor_id: actorId,
    });
  // The participant-facing operation has already completed. A history failure
  // must not undo an approval or turn a successfully sent pass into an error.
  if (error) console.error("Could not record workshop registration activity", error.message);
}

export const listNeuralNetworkWorkshopRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NeuralNetworkWorkshopRegistration[]> => {
    // A door volunteer only needs to verify one QR at a time. Do not expose the
    // attendee list (and its contact details) to a check-in-only account.
    await requireWorkshopAccess(context, ["manager"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("neural_network_workshop_registrations")
      .select(
        "id, name, srn, department, phone, email, year, attend_reason, expectation, qr_token, status, created_at, checked_in_at, pass_sent_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load workshop registrations.");
    const registrations = (data ?? []) as Omit<NeuralNetworkWorkshopRegistration, "activity">[];
    const ids = registrations.map((registration) => registration.id);
    if (ids.length === 0) return [];
    const { data: activity, error: activityError } = await supabaseAdmin
      .from("neural_network_workshop_registration_activity")
      .select("registration_id, action, created_at")
      .in("registration_id", ids)
      .order("created_at", { ascending: false });
    if (activityError) throw new Error("Could not load workshop activity.");
    const activityByRegistration = new Map<string, WorkshopRegistrationActivity[]>();
    for (const entry of activity ?? []) {
      const entries = activityByRegistration.get(entry.registration_id) ?? [];
      entries.push({
        action: entry.action as WorkshopRegistrationActivity["action"],
        created_at: entry.created_at,
      });
      activityByRegistration.set(entry.registration_id, entries);
    }
    return registrations.map((registration) => ({
      ...registration,
      activity: activityByRegistration.get(registration.id) ?? [],
    }));
  });

/** Used by the mobile desk before the camera is started. */
export const getNeuralNetworkWorkshopDeskAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const permission = await requireWorkshopAccess(context, ["manager", "checkin"]);
    return { permission };
  });

export const checkInNeuralNetworkWorkshop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().trim().min(8).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireWorkshopAccess(context, ["manager", "checkin"]);
    const code = normalizeWorkshopPassCode(data.code);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("neural_network_workshop_registrations")
      .select("id, name, srn, status, checked_in_at")
      .eq("qr_token", code)
      .maybeSingle();
    if (error || !row || row.status !== "approved") return { status: "invalid" as const };
    if (row.checked_in_at)
      return { status: "already" as const, name: row.name, srn: row.srn, at: row.checked_in_at };
    const at = new Date().toISOString();
    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from("neural_network_workshop_registrations")
      .update({ checked_in_at: at, checked_in_by: context.userId })
      .eq("id", row.id)
      .is("checked_in_at", null)
      .select("id");
    if (updateError) throw new Error("Could not record that check-in.");
    if (!updatedRows?.length) {
      const { data: latest } = await supabaseAdmin
        .from("neural_network_workshop_registrations")
        .select("checked_in_at")
        .eq("id", row.id)
        .single();
      return {
        status: "already" as const,
        name: row.name,
        srn: row.srn,
        at: latest?.checked_in_at ?? at,
      };
    }
    return { status: "ok" as const, name: row.name, srn: row.srn, at };
  });

export const setNeuralNetworkWorkshopStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireWorkshopAccess(context, ["manager"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: registration, error: lookupError } = await supabaseAdmin
      .from("neural_network_workshop_registrations")
      .select("name, email, qr_token")
      .eq("id", data.id)
      .single();
    if (lookupError || !registration) throw new Error("Could not find this registration.");

    const token =
      data.status === "approved"
        ? (registration.qr_token ?? `nn-${crypto.randomUUID().replaceAll("-", "")}`)
        : null;
    const { error } = await supabaseAdmin
      .from("neural_network_workshop_registrations")
      .update({
        status: data.status,
        qr_token: token,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
        // A rejected or returned-to-pending registration must not retain a usable pass.
        pass_sent_at: data.status === "approved" ? undefined : null,
      })
      .eq("id", data.id);
    if (error) throw new Error("Could not update registration status.");
    await recordRegistrationActivity(data.id, data.status, context.userId);

    if (data.status !== "approved" || !token) return { ok: true, emailSent: false };

    const { sendWorkshopPassEmail } = await import("@/lib/workshop-email.server");
    const emailSent = await sendWorkshopPassEmail({
      name: registration.name,
      email: registration.email,
      code: codeValue(token),
      passUrl: passUrl(token),
    });
    if (emailSent) {
      await supabaseAdmin
        .from("neural_network_workshop_registrations")
        .update({ pass_sent_at: new Date().toISOString() })
        .eq("id", data.id);
      await recordRegistrationActivity(data.id, "pass_sent", context.userId);
    }
    return { ok: true, emailSent };
  });

export const resendNeuralNetworkWorkshopPass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireWorkshopAccess(context, ["manager"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("neural_network_workshop_registrations")
      .select("name, email, qr_token, status")
      .eq("id", data.id)
      .single();
    if (error || row.status !== "approved")
      throw new Error("Only approved attendees can receive a pass.");
    const { sendWorkshopPassEmail } = await import("@/lib/workshop-email.server");
    if (!row.qr_token) throw new Error("This registration has no entry pass yet.");
    const sent = await sendWorkshopPassEmail({
      name: row.name,
      email: row.email,
      code: codeValue(row.qr_token),
      passUrl: passUrl(row.qr_token),
    });
    if (!sent)
      throw new Error(
        "Pass email could not be sent. Configure Resend or the Vertex Gmail SMTP settings in Vercel.",
      );
    await supabaseAdmin
      .from("neural_network_workshop_registrations")
      .update({ pass_sent_at: new Date().toISOString() })
      .eq("id", data.id);
    await recordRegistrationActivity(data.id, "pass_resent", context.userId);
    return { ok: true };
  });

export const getNeuralNetworkWorkshopPass = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().trim().min(8).max(80) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("neural_network_workshop_registrations")
      .select("name, qr_token, status")
      .eq("qr_token", data.code)
      .maybeSingle();
    if (!row || row.status !== "approved" || !row.qr_token) return null;
    return { name: row.name, code: codeValue(row.qr_token) };
  });

/**
 * Participant self-service recovery. The response is deliberately identical
 * whether or not the email has an approved registration, so this endpoint
 * cannot be used to enumerate attendees.
 */
export const requestNeuralNetworkWorkshopPass = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ email: z.string().trim().email().max(160) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { clientKey, rateLimit, RateLimitError } = await import("@/lib/rate-limit.server");
    try {
      rateLimit(await clientKey("neural-network-workshop", "pass-recovery"), 3, 60 * 60 * 1000);
    } catch (error) {
      if (error instanceof RateLimitError)
        throw new Error(`Too many requests. Try again in ${error.retryAfterSeconds}s.`);
      throw error;
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("neural_network_workshop_registrations")
      .select("id, name, email, qr_token, status")
      .eq("email", data.email.toLowerCase())
      .eq("status", "approved")
      .not("qr_token", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Do not reveal a lookup or database error to the caller. This action is
    // optional support convenience; the existing pass remains valid either way.
    if (error || !row?.qr_token) return { accepted: true };

    try {
      const { sendWorkshopPassEmail } = await import("@/lib/workshop-email.server");
      const sent = await sendWorkshopPassEmail({
        name: row.name,
        email: row.email,
        code: codeValue(row.qr_token),
        passUrl: passUrl(row.qr_token),
      });
      if (sent) {
        await supabaseAdmin
          .from("neural_network_workshop_registrations")
          .update({ pass_sent_at: new Date().toISOString() })
          .eq("id", row.id);
      }
    } catch (emailError) {
      console.error("Could not resend workshop pass from Pass Centre", emailError);
    }

    return { accepted: true };
  });

export const listNeuralNetworkWorkshopStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WorkshopStaff[]> => {
    await requireClubAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("neural_network_workshop_staff")
      .select("id, email, permission, active, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Could not load event staff.");
    return (data ?? []) as WorkshopStaff[];
  });

export const saveNeuralNetworkWorkshopStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(160),
        permission: z.enum(["manager", "checkin", "viewer"]),
        active: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireClubAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("neural_network_workshop_staff").upsert(
      {
        email: data.email.toLowerCase(),
        permission: data.permission,
        active: data.active,
        created_by: context.userId,
      },
      { onConflict: "email" },
    );
    if (error) throw new Error("Could not save event staff access.");
    return { ok: true };
  });

export const revokeNeuralNetworkWorkshopStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireClubAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("neural_network_workshop_staff")
      .update({ active: false })
      .eq("id", data.id);
    if (error) throw new Error("Could not revoke event desk access.");
    return { ok: true };
  });
