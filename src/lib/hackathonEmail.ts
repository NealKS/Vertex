/** All editable email copy and event values live here. No secrets belong in this file. */
export const HACKATHON_EMAIL = {
  eventName: "Vertex x Sarvam AI Hackathon",
  brand: "Vertex × Sarvam AI",
  finale: "13–14 November 2026",
  venue: "Offline at REVA University, Bengaluru",
  teamSize: "Exactly 4 members",
  WHATSAPP_GROUP_LINK: "", // REQUIRED: https://chat.whatsapp.com/...
  INDUS_LINK: "", // REQUIRED: official Sarvam Indus credit-claim URL
  SARVAM_LINKS: [] as { label: string; url: string }[],
  RULES: [
    "Teams must have exactly 4 members.",
    "Submit original work and respect intellectual property.",
    "Use Sarvam AI in your project.",
    "Follow all announced submission deadlines.",
    "Organizer decisions are final. Terms and conditions apply.",
  ],
  SCHEDULE: [
    {
      day: "Day 1 · 13 November",
      time: "TBD",
      activity: "Check-in, opening briefing and Sarvam AI orientation",
    },
    { day: "Day 1 · 13 November", time: "TBD", activity: "Build session and mentor checkpoints" },
    {
      day: "Day 2 · 14 November",
      time: "TBD",
      activity: "Final build session and submission deadline",
    },
    { day: "Day 2 · 14 November", time: "TBD", activity: "Project demos, judging and awards" },
  ],
  reconsiderApprovedSubject: "Updated decision: your team is selected · Vertex × Sarvam AI",
  reconsiderRejectedSubject: "Updated decision after reconsideration · Vertex × Sarvam AI",
  reconsiderApprovedHeading: "You’re now selected.",
  reconsiderRejectedHeading: "An update to your selection.",
  reconsiderApprovedMessage:
    "After reconsidering your submission, we are pleased to reverse our earlier rejection and select your team for the finale. This approval replaces the previous decision.",
  reconsiderRejectedMessage:
    "After reconsidering your submission, we regret to inform you that we are withdrawing our earlier approval. Your team is no longer selected for this finale. This update replaces the previous decision, and we apologize for the change.",
  reversalNoteHeading: "Reason for the updated decision",
  approvedSubject: "Your project is approved · Vertex × Sarvam AI",
  rejectedSubject: "Your submission update · Vertex × Sarvam AI",
  approvedHeading: "See you at the finale.",
  rejectedHeading: "Thank you for your idea.",
  greeting: "Hi",
  approvedIntro: "Congratulations!",
  approvedMessage: "is approved for the",
  rejectedMessage:
    "Thank you for participating. After reviewing your submission, we are unable to select your project for this finale.",
  futureMessage:
    "Please stay tuned for future Vertex events. We look forward to seeing what you build next.",
  whatsappButton: "Join the hackathon WhatsApp group",
  indusButton: "Claim your 500 API credits on Sarvam Indus",
  creditWarning:
    "IMPORTANT: Log in to Sarvam Indus ASAP to claim your 500 API credits. This is mandatory for every participant.",
  prizes: "Winner gets 15K cash prize + 25K API credits. Every participant gets 500 API credits.",
  logistics: "FOOD AND ACCOMMODATION WILL NOT BE PROVIDED.",
  terms:
    "Prize, credit and participation details are subject to the official terms and conditions.",
  rulesHeading: "Rules and regulations",
  scheduleHeading: "Detailed schedule · all times IST",
  linksHeading: "More from Sarvam",
  noteHeading: "Reviewer’s note",
  footer: "Vertex Club · REVA University · In collaboration with Sarvam AI",
};

export type ReviewEmailInput = {
  title: string;
  team: string;
  leader: string;
  status: "approved" | "rejected";
  note: string;
  reconsider?: boolean;
};
export type EmailContent = { subject: string; html: string; text: string };
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
function url(value: string) {
  try {
    if (new URL(value).protocol === "https:") return escape(value);
  } catch {
    /* Missing configuration */
  }
  throw new Error(
    "Fill WHATSAPP_GROUP_LINK, INDUS_LINK and valid HTTPS SARVAM_LINKS in src/lib/hackathonEmail.ts before approving submissions.",
  );
}

export function renderHackathonEmail(
  input: ReviewEmailInput,
  config: typeof HACKATHON_EMAIL = HACKATHON_EMAIL,
): EmailContent {
  const c = config;
  const approved = input.status === "approved";
  const project = `“${input.title}” by team “${input.team}”`;
  const intro = input.reconsider
    ? `${project}: ${approved ? c.reconsiderApprovedMessage : c.reconsiderRejectedMessage}`
    : approved
      ? `${c.approvedIntro} ${project} ${c.approvedMessage} ${c.eventName}.`
      : `${project}: ${c.rejectedMessage}`;
  const button = (label: string, href: string) =>
    `<p style="margin:24px 0"><a href="${url(href)}" style="display:inline-block;background:#243b2d;color:#fffdf8;padding:16px 22px;border-radius:28px;text-decoration:none;font-weight:bold">${escape(label)}</a></p>`;
  const approval = approved
    ? `
    <p>${escape(c.finale)}<br>${escape(c.venue)}<br>${escape(c.teamSize)}</p>
    ${button(c.whatsappButton, c.WHATSAPP_GROUP_LINK)}
    <p><strong>${escape(c.prizes)}</strong></p>
    <div style="padding:20px;background:#ecebdc;border:1px solid #aab99c;border-radius:14px"><strong>${escape(c.creditWarning)}</strong>${button(c.indusButton, c.INDUS_LINK)}</div>
    ${c.SARVAM_LINKS.length ? `<h2>${escape(c.linksHeading)}</h2><ul>${c.SARVAM_LINKS.map((link) => `<li><a href="${url(link.url)}">${escape(link.label)}</a></li>`).join("")}</ul>` : ""}
    <h2>${escape(c.rulesHeading)}</h2><ul>${c.RULES.map((rule) => `<li>${escape(rule)}</li>`).join("")}</ul>
    <h2>${escape(c.scheduleHeading)}</h2>${c.SCHEDULE.map((entry) => `<p><strong>${escape(entry.day)} · ${escape(entry.time)}</strong><br>${escape(entry.activity)}</p>`).join("")}
    <p style="padding:18px;border:2px solid #243b2d;border-radius:14px"><strong>${escape(c.logistics)}</strong></p><p>${escape(c.terms)}</p>`
    : `${input.note ? `<h2>${escape(input.reconsider ? c.reversalNoteHeading : c.noteHeading)}</h2><p style="white-space:pre-wrap">${escape(input.note)}</p>` : ""}<p>${escape(c.futureMessage)}</p>`;
  return {
    subject: input.reconsider
      ? approved
        ? c.reconsiderApprovedSubject
        : c.reconsiderRejectedSubject
      : approved
        ? c.approvedSubject
        : c.rejectedSubject,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body style="margin:0;background:#f7f4ed;color:#243b2d;font:15px/1.7 Arial,sans-serif"><main style="max-width:600px;margin:30px auto;padding:30px;background:#fffdf8;border:1px solid #ddd8cc;border-radius:22px"><p style="font:11px monospace;letter-spacing:2px;text-transform:uppercase">${escape(c.brand)}</p><h1 style="font:36px Georgia,serif">${escape(input.reconsider ? (approved ? c.reconsiderApprovedHeading : c.reconsiderRejectedHeading) : approved ? c.approvedHeading : c.rejectedHeading)}</h1><p>${escape(c.greeting)} ${escape(input.leader)},</p><p>${escape(intro)}</p>${input.reconsider && approved ? `<h2>${escape(c.reversalNoteHeading)}</h2><p style="white-space:pre-wrap">${escape(input.note)}</p>` : ""}${approval}<hr style="border:0;border-top:1px solid #ddd8cc"><p style="font:11px monospace">${escape(c.footer)}</p></main></body></html>`,
    text: [
      c.brand,
      `${c.greeting} ${input.leader},`,
      intro,
      ...(input.reconsider && approved ? [`${c.reversalNoteHeading}: ${input.note}`] : []),
      ...(approved
        ? [
            c.finale,
            c.venue,
            c.teamSize,
            `${c.whatsappButton}: ${c.WHATSAPP_GROUP_LINK}`,
            c.prizes,
            c.creditWarning,
            `${c.indusButton}: ${c.INDUS_LINK}`,
            ...c.SARVAM_LINKS.map((link) => `${link.label}: ${link.url}`),
            c.rulesHeading,
            ...c.RULES,
            c.scheduleHeading,
            ...c.SCHEDULE.map((entry) => `${entry.day} | ${entry.time} | ${entry.activity}`),
            c.logistics,
            c.terms,
          ]
        : [
            input.note
              ? `${input.reconsider ? c.reversalNoteHeading : c.noteHeading}: ${input.note}`
              : "",
            c.futureMessage,
          ]),
      c.footer,
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}
