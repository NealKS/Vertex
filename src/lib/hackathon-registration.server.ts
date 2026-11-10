import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { HackathonRegisterInput, RegistrationRecord } from "@/lib/hackathon-workspace.functions";

type Db = SupabaseClient<Database>;
type Row = Database["public"]["Tables"]["event_registrations"]["Row"];

async function workspaceEvent(db: Db) {
  const { data, error } = await db.from("events").select("id").eq("slug", "hackathon-workspace").maybeSingle();
  if (error || !data) throw new Error("Hackathon registration is unavailable. Please try again later.");
  return data.id;
}

export async function persistWorkspaceRegistration(db: Db, input: HackathonRegisterInput): Promise<RegistrationRecord> {
  const teamSize = input.registrationType === "team" ? input.teamMembers.length + 1 : 1;
  if (input.registrationType === "team" && (!input.teamName?.trim() || teamSize < 2)) throw new Error("A team name and at least one teammate are required.");
  if (input.registrationType === "individual" && input.teamMembers.length) throw new Error("Individual registrations cannot contain teammates.");
  const eventId = await workspaceEvent(db);
  const { data: workspace, error: workspaceError } = await db.from("event_workspaces").select("registration_open,min_team_size,max_team_size").eq("event_id", eventId).maybeSingle();
  if (workspaceError || !workspace) throw new Error("Hackathon registration is unavailable. Please try again later.");
  if (!workspace.registration_open) throw new Error("Hackathon registration is closed.");
  if (teamSize < workspace.min_team_size || teamSize > workspace.max_team_size) throw new Error("The registration does not meet this event's team size limits.");
  const email = input.email.trim().toLowerCase();
  const emails = [email, ...input.teamMembers.map((member) => member.email.trim().toLowerCase())];
  if (new Set(emails).size !== emails.length) throw new Error("Every team member must have a different email address.");
  const { data, error } = await db.from("event_registrations").insert({
    event_id: eventId, name: input.participantName, email, phone: input.phone || null,
    usn: input.collegeOrUsn || null, code: `VTX-HACK-${crypto.randomUUID().replaceAll("-", "").toUpperCase()}`,
    workspace_registration: {
      schema_version: 1, registrationType: input.registrationType, teamName: input.teamName || null,
      teamSize, teamMembers: input.teamMembers.map((member) => ({ name: member.name, email: member.email.trim().toLowerCase() })), track: input.track,
    },
  }).select("*").single();
  if (error?.code === "23505") throw new Error("This email is already registered for this event.");
  if (error || !data) throw new Error("Registration could not be saved. Please try again.");
  return registrationFromRow(data);
}

export async function listWorkspaceRegistrations(db: Db): Promise<RegistrationRecord[]> {
  const eventId = await workspaceEvent(db);
  const { data, error } = await db.from("event_registrations").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
  if (error) throw new Error("Registrations could not be loaded. Please try again.");
  return (data || []).map(registrationFromRow);
}

function registrationFromRow(row: Row): RegistrationRecord {
  const value = row.workspace_registration;
  const details = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const members = Array.isArray(details.teamMembers) ? details.teamMembers.flatMap((member) => {
    if (!member || typeof member !== "object" || Array.isArray(member) || typeof member.name !== "string" || typeof member.email !== "string") return [];
    return [{ name: member.name, email: member.email }];
  }) : [];
  const legacyTeam = row.usn?.match(/^Team:\s*(.*?)\s*\[/)?.[1];
  return {
    id: row.id, code: row.code, participantName: row.name, email: row.email, phone: row.phone || undefined,
    collegeOrUsn: row.usn || undefined, registrationType: details.registrationType === "team" || legacyTeam ? "team" : "individual",
    teamName: typeof details.teamName === "string" ? details.teamName : legacyTeam,
    teamSize: typeof details.teamSize === "number" ? details.teamSize : legacyTeam ? 2 : 1,
    teamMembers: members, track: typeof details.track === "string" ? details.track : row.usn?.match(/\[([^\]]+)\]/)?.[1] || row.usn?.match(/Track:\s*([^|]+)/)?.[1]?.trim() || "TO BE ANNOUNCED",
    status: "confirmed", registeredAt: row.created_at,
  };
}
