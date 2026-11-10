/** All event copy, links, schedule and guide content are editable here. No secrets. */
export const HACKATHON_EMAIL = {
  brand: "Vertex × Sarvam AI",
  eventName: "Build With Sarvam",
  finale: "13–14 November 2026",
  mode: "Offline, 24 hours",
  venue: "Rangasthala, REVA University, Bengaluru",
  teamSize: "Exactly 4 registered members; only those 4 may participate.",
  WHATSAPP_GROUP_LINK: "https://chat.whatsapp.com/F6kc0AsO66UJ559jACZLqz",
  INDUS_LINK:
    "https://indus.sarvam.ai/?utm_source=devrel&utm_medium=hackathon&utm_campaign=buildwith-sarvam",
  SARVAM_LINKS: [
    { label: "Documentation", url: "https://docs.sarvam.ai/" },
    { label: "Discord", url: "https://discord.com/invite/5rAsykttcs" },
  ],
  approvedSubject: "You're in! Build With Sarvam finale · Vertex × Sarvam AI",
  rejectedSubject: "Build With Sarvam · Your submission status",
  approvedHeading: "Congratulations, Team!",
  approvedMessage:
    "has been selected among the Top 50 teams for Build With Sarvam, a 24-hour inter-college AI hackathon by Vertex Club, REVA University, in partnership with Sarvam AI.",
  creditWarning:
    "Each participant gets 500 Sarvam API credits. All four members must register at the Sarvam link below as soon as possible so credits can be processed.",
  indusButton: "Register on Sarvam",
  whatsappButton: "Join the official WhatsApp group",
  logistics:
    "Food and accommodation will not be provided by the organizers. Please plan accordingly, as there is an overnight session.",
  guideFilename: "Build-With-Sarvam-Finale-Guide.pdf",
  guideMessage:
    "Full rules, schedule and prizes are in the attached PDF: Build-With-Sarvam-Finale-Guide.pdf",
  guideMissingMessage:
    "The finale guide could not be attached. Team Vertex will send it separately.",
  approvedClosing:
    "Before arriving, make sure all four members have registered with Sarvam, joined the WhatsApp group, and are ready for the full 24 hours. We look forward to seeing your ideas come to life!",
  signOff: [
    "Regards,",
    "Team Vertex",
    "REVA University",
    "Build With Sarvam",
    "Code • Innovate • Elevate",
  ],
  rejectedGreeting: "Dear Team,",
  // **...** and *...* are the only supported emphasis markers.
  rejectedParagraphs: [
    "Thank you for registering for **Build With Sarvam** and for the effort you put into your submission.",
    "After reviewing all the entries, we regret to inform you that your team has **not been selected among the Top 50 teams** for the finale.",
    "We received a large number of strong submissions, and the selection was limited to 50 teams.",
    "We truly appreciate your interest in Build With Sarvam and encourage you to continue building, participating, and innovating. We hope to see your team in our future events.",
    "**Wishing you all the best for your future projects and competitions!**",
  ],
  rejectedSignOff: [
    "Regards,",
    "**Team Vertex**",
    "REVA University",
    "*Code • Innovate • Elevate*",
  ],
  SCHEDULE: [
    {
      day: "Day 1 – 13 November 2026",
      time: "09:00–09:30 AM",
      activity: "Opening Ceremony & Welcome Address",
    },
    { day: "Day 1 – 13 November 2026", time: "09:30 AM", activity: "Hackathon Officially Begins" },
    { day: "Day 1 – 13 November 2026", time: "01:00–02:00 PM", activity: "Lunch Break" },
    { day: "Day 1 – 13 November 2026", time: "03:30–05:00 PM", activity: "Mentoring Round 1" },
    { day: "Day 1 – 13 November 2026", time: "07:30–08:30 PM", activity: "Dinner Break" },
    {
      day: "Day 1 – 13 November 2026",
      time: "09:00–10:30 PM",
      activity: "Progress Review & Mid-Hackathon Check-in",
    },
    {
      day: "Day 1 – 13 November 2026",
      time: "10:30 PM onwards",
      activity: "Continued Development / Overnight Session",
    },
    { day: "Day 2 – 14 November 2026", time: "07:30–08:30 AM", activity: "Breakfast Break" },
    {
      day: "Day 2 – 14 November 2026",
      time: "08:30–10:00 AM",
      activity: "Final Submission Deadline",
    },
    { day: "Day 2 – 14 November 2026", time: "11:00 AM", activity: "Top 10 Teams Announced" },
    {
      day: "Day 2 – 14 November 2026",
      time: "11:30 AM–01:00 PM",
      activity: "Final Presentations by Top 10 Teams",
    },
    {
      day: "Day 2 – 14 November 2026",
      time: "02:30 PM",
      activity: "Winner Announcement & Awards Ceremony",
    },
    {
      day: "Day 2 – 14 November 2026",
      time: "03:30 PM",
      activity: "Closing Remarks & Event Conclusion",
    },
  ],
  PRIZES: [
    "Total prize pool: ₹25,000 worth of Sarvam API credits.",
    "1st: ₹13,000 worth of API credits.",
    "2nd: ₹7,000 worth of API credits.",
    "3rd: ₹5,000 worth of API credits.",
    "Each participant is eligible for 500 Sarvam API credits.",
  ],
  RULES: [
    "Exactly 4 registered members; team members cannot be added or replaced without organizer approval.",
    "Carry a valid college ID card.",
    "Report on time and follow the schedule.",
    "Maintain discipline and professional conduct.",
    "Misconduct, indiscipline, harassment, damage to university property or violation of campus rules may lead to disqualification of the entire team.",
    "Follow instructions of Vertex Club organizers, REVA University authorities and event officials.",
    "Cheating, malpractice or rule violations may lead to disqualification.",
    "The organizing committee's decision on violations is final.",
  ],
  guideFood:
    "Food and accommodation are not provided by the organizers. Participants must arrange their own and plan accordingly because of the overnight development session.",
};
export type ReviewEmailInput = {
  title: string;
  team: string;
  leader: string;
  status: "approved" | "rejected";
  note?: string;
  reconsider?: boolean;
  guideAttached?: boolean;
};
export type EmailContent = { subject: string; html: string; text: string };
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
const rich = (value: string) =>
  escape(value)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
const plain = (value: string) => value.replace(/\*/g, "");
export function renderHackathonEmail(input: ReviewEmailInput): EmailContent {
  const c = HACKATHON_EMAIL;
  const approved = input.status === "approved";
  const intro = `“${input.team}” with “${input.title}” ${c.approvedMessage}`;
  const guide = input.guideAttached === false ? c.guideMissingMessage : c.guideMessage;
  const button = (label: string, href: string) =>
    `<p style="margin:22px 0"><a href="${escape(href)}" style="display:inline-block;background:#b8d9aa;color:#102018;padding:14px 20px;border-radius:8px;font-weight:bold;text-decoration:none">${escape(label)}</a></p>`;
  const body = approved
    ? `<h1 style="font:30px Georgia,serif;color:#f6f4ec">${escape(c.approvedHeading)}</h1><p>${escape(intro)}</p><div style="padding:18px;background:#202b22;border:1px solid #40523e;border-radius:10px">${[`${c.eventName} | ${c.finale}`, `${c.mode} | ${c.venue}`, c.teamSize].map(escape).join("<br>")}</div><div style="margin-top:20px;padding:18px;background:#263b29;border-left:4px solid #b8d9aa"><strong>${escape(c.creditWarning)}</strong>${button(c.indusButton, c.INDUS_LINK)}</div>${button(c.whatsappButton, c.WHATSAPP_GROUP_LINK)}<p>${escape(c.logistics)}</p><p>${escape(guide)}</p><p style="font-size:13px">${c.SARVAM_LINKS.map((link) => `<a style="color:#b8d9aa" href="${escape(link.url)}">${escape(link.label)}</a>`).join(" · ")}</p><p>${escape(c.approvedClosing)}</p><p>${c.signOff.map(escape).join("<br>")}</p>`
    : `<p>${escape(c.rejectedGreeting)}</p>${c.rejectedParagraphs.map((p) => `<p>${rich(p)}</p>`).join("")}<p>${c.rejectedSignOff.map(rich).join("<br>")}</p>`;
  return {
    subject: approved ? c.approvedSubject : c.rejectedSubject,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="dark"></head><body style="margin:0;background:#101713;color:#eeeade;font:15px/1.7 Arial,sans-serif"><main style="max-width:600px;margin:28px auto;padding:28px;background:#18231c;border:1px solid #3b4c3e;border-radius:18px"><p style="font:11px monospace;letter-spacing:2px;color:#b8d9aa">${escape(c.brand)}</p>${body}</main></body></html>`,
    text: approved
      ? [
          c.brand,
          c.approvedHeading,
          intro,
          `${c.eventName} | ${c.finale}`,
          c.mode,
          c.venue,
          c.teamSize,
          c.creditWarning,
          `${c.indusButton}: ${c.INDUS_LINK}`,
          `${c.whatsappButton}: ${c.WHATSAPP_GROUP_LINK}`,
          c.logistics,
          guide,
          ...c.SARVAM_LINKS.map((l) => `${l.label}: ${l.url}`),
          c.approvedClosing,
          c.signOff.join("\n"),
        ].join("\n\n")
      : [
          c.rejectedGreeting,
          ...c.rejectedParagraphs.map(plain),
          c.rejectedSignOff.map(plain).join("\n"),
        ].join("\n\n"),
  };
}
