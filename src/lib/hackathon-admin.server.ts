import { setResponseStatus, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { loadViewer, type Db } from "@/lib/roles.server";
import { submissionFromRow } from "@/lib/hackathon-admin";
import { renderHackathonEmail } from "@/lib/hackathonEmail";

export function fail(status: number, message: string): never {
  setResponseStatus(status);
  throw new Error(message);
}
export async function requireHackathonAccess(context: { supabase: Db; userId: string }) {
  setResponseHeader("Cache-Control", "private, no-store");
  const viewer = await loadViewer(context.supabase, context.userId);
  if (!viewer.isAllowlisted) fail(403, "Admins only.");
  const { data: listed, error } = await context.supabase.rpc("is_hackathon_admin");
  if (error) fail(503, "Apply the hackathon live migration before opening this console.");
  if (!listed) fail(403, "Admins only. This email must also be in the database admin list.");
  return viewer;
}
export async function sarvamEventId(): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("slug", "build-with-sarvam")
    .single();
  if (error || !data)
    throw new Error("Build with Sarvam is unavailable. Check the database migrations.");
  return data.id;
}
export async function allSubmissions(includeReviewerEmails = false) {
  const eventId = await sarvamEventId();
  const rows = [];
  // Explicit pagination avoids Supabase's default 1,000-row cap, including in CSV exports.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabaseAdmin
      .from("event_registrations")
      .select(
        "reconsidering,reversal_reason,previous_status,id,event_id,name,email,phone,usn,code,created_at,status,form_data,reviewed_at,reviewed_by,review_note,email_sent_at,checked_in_at,checked_in_by,pass_sent_at,pass_sent_to,workspace_registration",
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 499);
    if (error)
      throw new Error("Could not load submissions. Apply the Sarvam admin migration first.");
    rows.push(...data.map(submissionFromRow));
    if (data.length < 500) break;
  }
  if (includeReviewerEmails) {
    const emails = new Map<string, string>();
    // One lookup per recorded reviewer, only for authenticated CSV exports.
    for (const id of new Set(
      rows.map((row) => row.reviewedBy).filter((id): id is string => Boolean(id)),
    )) {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
      if (error && error.status !== 404)
        throw new Error("Could not verify reviewer emails. Please retry the export.");
      if (data.user?.email) emails.set(id, data.user.email);
    }
    for (const row of rows)
      row.reviewedByEmail = row.reviewedBy ? (emails.get(row.reviewedBy) ?? null) : null;
  }
  return { eventId, rows };
}
const payloadSchema = z.object({
  from: z.string(),
  to: z.array(z.string().email()),
  subject: z.string(),
  html: z.string(),
  text: z.string(),
  reply_to: z.string().optional(),
});
export async function deliverReviewEmail(id: string) {
  if (!process.env.RESEND_API_KEY)
    throw new Error("Set RESEND_API_KEY on the server to send review emails.");
  const { data, error } = await supabaseAdmin.rpc("claim_sarvam_review_email", { p_id: id });
  if (error) throw new Error("Could not claim the review email.");
  const outbox = data?.[0];
  if (!outbox) {
    const { data: current, error: lookupError } = await supabaseAdmin
      .from("hackathon_review_emails")
      .select("sent_at,first_attempt_at")
      .eq("registration_id", id)
      .maybeSingle();
    if (lookupError) throw new Error("Could not check email delivery.");
    if (current?.sent_at) return { emailSent: true, emailMessage: "Email already sent." };
    return {
      emailSent: false,
      emailMessage:
        "Email is processing, or needs provider verification after the 23-hour safe retry window. Retry after one minute; do not manually resend without checking Resend.",
    };
  }
  try {
    const payload = payloadSchema.parse(outbox.payload);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `vertex-review-${outbox.id}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
    const completed = await supabaseAdmin.rpc("complete_sarvam_review_email", {
      p_id: id,
      p_claimed_at: outbox.claimed_at!,
    });
    if (completed.error) throw new Error("Email accepted, but delivery record could not be saved.");
    return { emailSent: true, emailMessage: "Decision email sent to the team leader." };
  } catch (error) {
    // Keep the claim for 60 seconds. Retrying uses exactly the same persisted payload/key.
    console.error(
      "Sarvam review email:",
      error instanceof Error ? error.message : "Delivery uncertain",
    );
    return {
      emailSent: false,
      emailMessage:
        "Decision saved; email not confirmed. Check email configuration and retry after one minute.",
    };
  }
}
export async function reviewSubmission(
  context: { supabase: Db; userId: string },
  input: { id: string; status: "approved" | "rejected"; note: string; reconsider?: boolean },
) {
  await requireHackathonAccess(context);
  const eventId = await sarvamEventId();
  const { data, error } = await supabaseAdmin
    .from("event_registrations")
    .select("*")
    .eq("id", input.id)
    .eq("event_id", eventId)
    .single();
  if (error || !data) fail(404, "Submission not found.");
  if (input.reconsider && !input.note.trim()) fail(400, "Reversing a decision requires a reason.");
  if (
    input.reconsider
      ? !data.reconsidering ||
        !["approved", "rejected"].includes(data.status) ||
        data.status === input.status
      : data.status !== "pending"
  )
    fail(409, "This submission has already been reviewed. Refresh the list.");
  const row = submissionFromRow(data);
  if (input.status === "approved" && row.members.length !== 4)
    fail(400, "Approval requires exactly 4 team members.");
  const from = process.env.FROM_EMAIL || process.env.EVENTS_FROM_EMAIL;
  if (!process.env.RESEND_API_KEY || !from)
    fail(503, "Set RESEND_API_KEY and FROM_EMAIL before reviewing submissions.");
  const content = renderHackathonEmail({
    ...row,
    status: input.status,
    note: input.note,
    reconsider: input.reconsider,
  });
  const payload = {
    from,
    to: [row.email],
    ...content,
    ...(process.env.EVENTS_REPLY_TO ? { reply_to: process.env.EVENTS_REPLY_TO } : {}),
  };
  const result = await supabaseAdmin.rpc(
    input.reconsider ? "reconsider_sarvam_submission" : "review_sarvam_submission",
    {
      p_id: input.id,
      p_status: input.status,
      p_reviewer: context.userId,
      p_note: input.note,
      p_payload: payload,
    },
  );
  if (result.error?.message.includes("Previous email is processing"))
    fail(409, "The previous decision email is still processing. Retry after one minute.");
  if (result.error)
    throw new Error("Could not save this review. Check the Sarvam admin migrations.");
  if (!result.data) fail(409, "Another reviewer has already processed this submission.");
  return { ok: true, ...(await deliverReviewEmail(input.id)) };
}
