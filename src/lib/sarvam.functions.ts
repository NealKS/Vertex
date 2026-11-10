import { createServerFn } from "@tanstack/react-start";
import { sarvamHackathonRegistrationInput } from "@/lib/schemas";

export const registerForSarvamHackathon = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => sarvamHackathonRegistrationInput.parse(input))
  .handler(async ({ data }) => {
    const { clientKey, rateLimit, RateLimitError } = await import("@/lib/rate-limit.server");
    try {
      rateLimit(await clientKey("build-with-sarvam", "registration"), 5, 60 * 60 * 1000);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new Error(
          `Too many registration attempts. Try again in ${error.retryAfterSeconds}s.`,
        );
      }
      throw error;
    }

    const emails = data.members.map((member) => member.email.trim().toLowerCase());
    if (new Set(emails).size !== emails.length) {
      throw new Error("Each team member must use a different email address.");
    }

    const usns = data.members.map((member) => member.usn.trim().toLowerCase()).filter(Boolean);
    if (new Set(usns).size !== usns.length) {
      throw new Error("Each team member must use a different USN.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, title, event_date, location")
      .eq("slug", "build-with-sarvam")
      .eq("published", true)
      .maybeSingle();
    if (eventError || !event) throw new Error("The Build with Sarvam workspace is unavailable.");

    const { data: operations, error: operationsError } = await supabaseAdmin
      .from("event_operation_settings")
      .select("registration_mode, registration_open, registration_closes_at, requires_approval")
      .eq("event_id", event.id)
      .maybeSingle();
    if (
      operationsError ||
      operations?.registration_mode !== "team" ||
      operations.registration_open !== true
    ) {
      throw new Error("Team registration is currently closed.");
    }
    if (
      operations.registration_closes_at &&
      new Date(operations.registration_closes_at) <= new Date()
    ) {
      throw new Error("Team registration is currently closed.");
    }

    const lead = data.members[0];
    const { data: row, error } = await supabaseAdmin
      .from("event_registrations")
      .insert({
        event_id: event.id,
        name: lead.name,
        email: lead.email.toLowerCase(),
        phone: lead.phone || null,
        usn: lead.usn || null,
        // Every Sarvam idea requires an allowlisted reviewer, regardless of generic event settings.
        status: "pending",
        pass_sent_to: lead.email.toLowerCase(),
        form_data: {
          team_name: data.teamName,
          member_count: data.members.length,
          members: data.members.map((member, index) => ({
            ...member,
            email: member.email.toLowerCase(),
            is_lead: index === 0,
          })),
          submission_type: "idea",
          project_title: data.projectTitle,
          track: data.track,
          problem: data.problem,
          solution: data.solution,
          innovation: data.innovation,
          ai_use: data.aiUse,
          beneficiaries: data.beneficiaries,
          originality_confirmed: data.originalityConfirmed,
          rules_confirmed: data.rulesConfirmed,
        },
      })
      .select("id, status")
      .single();

    if (error?.code === "23505") {
      throw new Error("This team lead email is already registered for Build with Sarvam.");
    }
    if (error || !row) throw new Error("Could not save your team registration. Please try again.");

    return {
      ok: true,
      status: row.status as "pending" | "approved",
      teamName: data.teamName,
      memberCount: data.members.length,
      event,
    };
  });
