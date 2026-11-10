import assert from "node:assert/strict";
import { isAdminEmail } from "../src/lib/admin-access.server.ts";
import {
  approvedCsv,
  rejectedCsv,
  submissionFromRow,
  safeLink,
} from "../src/lib/hackathon-admin.ts";
import { HACKATHON_EMAIL, renderHackathonEmail } from "../src/lib/hackathonEmail.ts";

const original = process.env.ADMIN_EMAILS;
process.env.ADMIN_EMAILS = " Extra@Example.test, second@example.test , ,";
assert.equal(isAdminEmail(" NEAL.KOTTILINGAL.IN@GMAIL.COM "), true);
assert.equal(isAdminEmail("extra@example.test"), true);
assert.equal(isAdminEmail("attacker@example.test"), false);
assert.equal(isAdminEmail(undefined), false);
if (original === undefined) delete process.env.ADMIN_EMAILS;
else process.env.ADMIN_EMAILS = original;

const row = submissionFromRow({
  id: "test",
  name: "Leader",
  email: "lead@example.test",
  phone: "+919876543210",
  status: "approved",
  created_at: "2026-11-09T10:00:00Z",
  reviewed_at: "2026-11-09T11:00:00Z",
  review_note: null,
  email_sent_at: null,
  form_data: {
    team_name: '=HYPERLINK("bad")',
    project_title: 'A "quoted", idea\ncontinued',
    solution: "An idea for learners".repeat(100),
    idea_summary: "Complete summary ".repeat(100),
    track: "Education",
    members: [
      {
        name: "Leader",
        email: "lead@example.test",
        college: "REVA",
        phone: "1234567890",
        usn: "SAMPLE001",
        branch: "CSE",
        year: "3",
      },
    ],
    project_url: "https://example.test/project",
    repo_url: "javascript:alert(1)",
    ppt_url: "https://example.test/slides.pptx",
    attachments: [
      { name: "Research notes", url: "https://example.test/notes.pdf" },
      { name: "Unsafe", url: "javascript:alert(1)" },
    ],
  },
});
assert.equal(row.members[0].role, "Team leader");
assert.equal(row.links.length, 3);
assert.ok(row.links.some((link) => link.url.endsWith("slides.pptx")));
assert.equal(row.members[0].phone, "1234567890");
assert.equal(row.members[0].usn, "SAMPLE001");
assert.equal(row.members[0].branch, "CSE");
assert.equal(row.members[0].year, "3");
assert.ok(row.details.find((item) => item.label === "Solution").value.length > 1000);
assert.ok(row.details.find((item) => item.label === "Full idea summary").value.length > 1000);
assert.equal(row.idea.length, 220);
assert.equal(safeLink("javascript:alert(1)"), false);
assert.equal(safeLink("https://example.test"), true);
assert.deepEqual(
  submissionFromRow({
    ...row,
    name: "Leader",
    email: "lead@example.test",
    created_at: "today",
    form_data: null,
  }).members,
  [],
);
const csv = approvedCsv([row, { ...row, status: "pending", title: "Do not export me" }]);
assert.equal(csv.charCodeAt(0), 0xfeff);
assert.match(csv, /"'=HYPERLINK\(""bad""\)"/);
assert.match(csv, /"A ""quoted"", idea\ncontinued"/);
assert.match(csv, /"'\+919876543210"/);
assert.doesNotMatch(csv, /Do not export me/);
assert.match(approvedCsv([{ ...row, team: "\t=1+1" }]), /"'\t=1\+1"/);
assert.match(csv, /Leader email/);
assert.doesNotMatch(csv, /All members/);
const contactExport = approvedCsv([
  {
    ...row,
    reviewedByEmail: "reviewer@example.test",
    members: [
      ...row.members,
      {
        name: "Private Member",
        email: "private-member@example.test",
        phone: "555PRIVATE",
        college: "Sample",
        role: "Member",
      },
    ],
  },
]);
assert.match(contactExport, /Approved by email/);
assert.match(contactExport, /reviewer@example.test/);
assert.match(contactExport, /lead@example.test/);
assert.doesNotMatch(contactExport, /Private Member|private-member@example.test|555PRIVATE/);
assert.match(
  rejectedCsv([{ ...row, status: "rejected", reviewedByEmail: "rejector@example.test" }]),
  /Rejected by email/,
);

const reversedApproved = {
  ...row,
  previousStatus: "rejected",
  reversalReason: "Selected after reassessment",
};
const reversedRejected = {
  ...row,
  title: "Withdrawn idea",
  status: "rejected",
  previousStatus: "approved",
  reversalReason: "Missing integration",
};
const mainApproved = approvedCsv([row, reversedApproved, reversedRejected]);
assert.match(mainApproved, /REVERSED DECISION/);
assert.match(mainApproved, /Selected after reassessment/);
assert.doesNotMatch(mainApproved, /Missing integration/);
const rejectedExport = rejectedCsv([row, reversedApproved, reversedRejected]);
assert.match(rejectedExport, /REVERSED DECISION/);
assert.match(rejectedExport, /Missing integration/);
assert.doesNotMatch(rejectedExport, /Selected after reassessment/);
assert.match(rejectedExport, /Withdrawn idea/);

const input = {
  title: '<script>alert("x")</script>',
  team: '"Team"',
  leader: "A & B",
  status: "approved",
  note: "",
};
assert.throws(() => renderHackathonEmail(input), /WHATSAPP_GROUP_LINK/);
HACKATHON_EMAIL.WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/test";
HACKATHON_EMAIL.INDUS_LINK = "https://example.test/indus";
const email = renderHackathonEmail(input);
assert.doesNotMatch(email.html, /<script>/);
for (const value of [
  "13–14 November 2026",
  "REVA University, Bengaluru",
  "Exactly 4",
  "15K",
  "25K",
  "500",
  "FOOD AND ACCOMMODATION WILL NOT BE PROVIDED",
  "mandatory",
  "TBD",
  "official terms",
])
  assert.ok(email.text.includes(value), value);
assert.match(email.html, /href="https:\/\/chat.whatsapp.com\/test"/);
const rejected = renderHackathonEmail({
  ...input,
  status: "rejected",
  note: "<img src=x onerror=alert(1)>",
});
assert.doesNotMatch(rejected.html, /<img/);
assert.match(rejected.text, /future Vertex events/);
HACKATHON_EMAIL.INDUS_LINK = "javascript:alert(1)";
assert.throws(() => renderHackathonEmail(input), /HTTPS/);
console.log(
  "Hackathon tests passed: allowlist normalization, CSV escaping/formula defense, private-data mapping, safe links, complete email content and HTML escaping.",
);
