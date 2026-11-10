import type { Database } from "@/integrations/supabase/types";

export type Registration = Database["public"]["Tables"]["event_registrations"]["Row"];
export type Announcement = Database["public"]["Tables"]["event_announcements"]["Row"];
export type TeamMember = {
  name: string;
  email: string;
  college: string;
  role: string;
  phone?: string;
  usn?: string;
  branch?: string;
  year?: string;
};
export type Submission = {
  id: string;
  team: string;
  title: string;
  idea: string;
  track: string;
  leader: string;
  email: string;
  phone: string;
  college: string;
  members: TeamMember[];
  details: { label: string; value: string }[];
  links: { label: string; url: string }[];
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy?: string | null;
  reviewedByEmail?: string | null;
  reviewNote: string | null;
  emailSentAt: string | null;
  guideMissing?: boolean;
  reconsidering?: boolean;
  reversalReason?: string | null;
  previousStatus?: string | null;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function string(value: unknown): string {
  return typeof value === "string" ? value : "";
}
export function safeLink(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function submissionFromRow(row: Registration): Submission {
  const form = record(row.form_data);
  const members = (Array.isArray(form.members) ? form.members : []).map((value, i) => {
    const member = record(value);
    return {
      name: string(member.name),
      email: string(member.email),
      college: string(member.college),
      phone: string(member.phone),
      usn: string(member.usn),
      branch: string(member.branch),
      year: string(member.year),
      role: member.is_lead || i === 0 ? "Team leader" : "Member",
    };
  });
  const details = [
    ["Full idea summary", "idea_summary"],
    ["Problem", "problem"],
    ["Solution", "solution"],
    ["Innovation", "innovation"],
    ["Sarvam AI use", "ai_use"],
    ["Beneficiaries", "beneficiaries"],
    ["Description", "description"],
  ]
    .map(([label, key]) => ({ label, value: string(form[key]) }))
    .filter((item) => item.value);
  const links = [
    ["Project", "project_url"],
    ["Repository", "repo_url"],
    ["Demo", "demo_url"],
    ["Video", "video_url"],
    ["Presentation / PPT", "ppt_url"],
    ["Presentation", "presentation_url"],
    ["Pitch deck", "pitch_deck_url"],
    ["Slide deck", "deck_url"],
    ["Presentation file", "deck_path"],
  ]
    .map(([label, key]) => ({ label, url: string(form[key]) }))
    .filter((item) => safeLink(item.url));
  // Preserve submitted file links without guessing storage buckets or exposing private paths.
  for (const [i, attachment] of (Array.isArray(form.attachments)
    ? form.attachments
    : []
  ).entries()) {
    const file = record(attachment);
    const href = typeof attachment === "string" ? attachment : string(file.url);
    if (safeLink(href) && !links.some((link) => link.url === href)) {
      links.push({ label: string(file.name) || `Attachment ${i + 1}`, url: href });
    }
  }
  return {
    id: row.id,
    team: string(form.team_name) || row.name,
    title: string(form.project_title) || "Untitled idea",
    idea: (string(form.idea_summary) || string(form.solution) || string(form.problem))
      .replace(/\s+/g, " ")
      .slice(0, 220),
    track: string(form.track) || "Not specified",
    leader: row.name,
    email: row.email,
    phone: row.phone || "",
    college: [...new Set(members.map((member) => member.college).filter(Boolean))].join(", "),
    members,
    details,
    links,
    status: row.status,
    submittedAt: row.created_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    reviewNote: row.review_note,
    emailSentAt: row.email_sent_at,
    guideMissing: row.guide_missing,
    reconsidering: row.reconsidering,
    reversalReason: row.reversal_reason,
    previousStatus: row.previous_status,
  };
}

/** RFC 4180 quoting, Excel BOM and spreadsheet-formula neutralization. */
export function approvedCsv(
  rows: Submission[],
  reversals = false,
  status: "approved" | "rejected" = "approved",
): string {
  // Control characters can hide a leading spreadsheet formula.
  // eslint-disable-next-line no-control-regex
  const formula = /^[\s\u0000-\u001f]*[=+@-]/;
  const cell = (value: string) =>
    `"${(formula.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
  const header = [
    "Team name",
    "Project title",
    "Track",
    "Idea summary",
    "Team leader name",
    "Team leader email",
    "Team leader phone",
    "Approved by (admin email)",
    "Approved at",
    "Decision origin",
    "Current decision",
    "Previous decision",
    "Reason for reversing decision",
  ];
  const values = rows
    .filter((row) => (reversals ? Boolean(row.reversalReason) : row.status === status))
    .sort((a, b) => Number(Boolean(b.reversalReason)) - Number(Boolean(a.reversalReason)))
    .map((row) => [
      row.team,
      row.title,
      row.track,
      row.idea,
      row.leader,
      row.email,
      row.phone,
      row.reviewedByEmail || "Unavailable (reviewer not recorded)",
      row.reviewedAt ?? "",
      row.reversalReason ? "REVERSED" : "INITIAL",
      row.status,
      row.previousStatus ?? "",
      row.reversalReason ?? "",
    ]);
  return "\uFEFF" + [header, ...values].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

export function rejectedCsv(rows: Submission[]): string {
  return approvedCsv(rows, false, "rejected");
}
