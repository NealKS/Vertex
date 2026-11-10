import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const hackathonRegisterInput = z.object({
  registrationType: z.enum(["individual", "team"]),
  participantName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(160),
  phone: z.string().trim().min(7, "Phone number too short").max(20).optional().or(z.literal("")),
  collegeOrUsn: z.string().trim().max(100).optional().or(z.literal("")),
  teamName: z.string().trim().max(100).optional().or(z.literal("")),
  teamSize: z.number().int().min(1).max(4).optional().default(1),
  teamMembers: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Teammate name required"),
        email: z.string().trim().email("Invalid teammate email"),
      }),
    )
    .max(3)
    .optional()
    .default([]),
  track: z.enum(["SARVAM AI", "ABSCISSA", "OPEN INNOVATION", "TO BE ANNOUNCED"]),
});

export type HackathonRegisterInput = z.infer<typeof hackathonRegisterInput>;

export type RegistrationRecord = {
  id: string;
  code: string;
  registrationType: "individual" | "team";
  participantName: string;
  email: string;
  phone?: string;
  collegeOrUsn?: string;
  teamName?: string;
  teamSize: number;
  teamMembers: Array<{ name: string; email: string }>;
  track: string;
  status: "confirmed";
  registeredAt: string;
};

export const registerForHackathonWorkspace = createServerFn({ method: "POST" })
  .validator((input: unknown) => hackathonRegisterInput.parse(input))
  .handler(async ({ data }) => {
    const { clientKey, rateLimit, RateLimitError } = await import("@/lib/rate-limit.server");
    try {
      rateLimit(await clientKey("hackathon-reg", "hackathon-register"), 10, 60 * 60 * 1000);
    } catch (error) {
      if (error instanceof RateLimitError) throw new Error(`Too many registration attempts. Please retry in ${error.retryAfterSeconds}s.`);
      throw error;
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { persistWorkspaceRegistration } = await import("@/lib/hackathon-registration.server");
    const registration = await persistWorkspaceRegistration(supabaseAdmin, data);
    return { success: true, registration, message: `Registration confirmed for ${registration.participantName} (${registration.track} Track). Keep your registration pass code handy for on-site check-in.` };
  });

export const getHackathonWorkspaceRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff } = await import("@/lib/roles.server");
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { listWorkspaceRegistrations } = await import("@/lib/hackathon-registration.server");
    return listWorkspaceRegistrations(supabaseAdmin);
  });

/**
 * Check if the current visitor is an authenticated organizer
 */
export const getHackathonWorkspaceViewer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadViewer } = await import("@/lib/roles.server");
    const viewer = await loadViewer(context.supabase, context.userId);
    return {
      isAuthenticated: true,
      isOrganizer: viewer.isAdmin || viewer.isHead,
      name: viewer.member?.name ?? "Staff",
      roles: viewer.roles,
    };
  });
