import { z } from "zod";

export const memberInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  role: z.string().trim().min(2).max(80),
  teamId: z.string().trim().max(40).nullable(),
  isHead: z.boolean(),
  isLeadership: z.boolean(),
  photoUrl: z.string().trim().max(1000).nullable(),
  bio: z.string().trim().max(2000).nullable(),
  skills: z.array(z.string().trim().min(1).max(40)).max(20),
  links: z.record(z.string(), z.string().trim().max(300)),
  sortOrder: z.number().int().min(0).max(999),
});

export const memberSelfInput = z.object({
  bio: z.string().trim().max(2000).nullable(),
  skills: z.array(z.string().trim().min(1).max(40)).max(20),
  links: z.record(z.string(), z.string().trim().max(300)),
  photoUrl: z.string().trim().max(1000).nullable(),
});

export const eventInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  title: z.string().trim().min(2).max(140),
  eventDate: z.string().trim().min(4).max(20),
  startTime: z.string().trim().max(40).nullable(),
  location: z.string().trim().min(1).max(140),
  tag: z.string().trim().min(1).max(40),
  description: z.string().trim().max(2000).nullable(),
  coverUrl: z.string().trim().max(1000).nullable(),
  capacity: z.number().int().min(0).max(100000).nullable(),
  published: z.boolean(),
  operations: z
    .object({
      registrationMode: z.enum(["individual", "team", "disabled"]),
      registrationOpen: z.boolean(),
      registrationOpensAt: z.string().datetime().nullable(),
      registrationClosesAt: z.string().datetime().nullable(),
      requiresApproval: z.boolean(),
      waitlistEnabled: z.boolean(),
      passesEnabled: z.boolean(),
      checkinEnabled: z.boolean(),
      emailEnabled: z.boolean(),
      teamMinSize: z.number().int().min(1).max(100),
      teamMaxSize: z.number().int().min(1).max(100),
      submissionsEnabled: z.boolean(),
      judgingEnabled: z.boolean(),
    })
    .refine((value) => value.teamMaxSize >= value.teamMinSize, {
      message: "Maximum team size must be at least the minimum.",
      path: ["teamMaxSize"],
    }),
});

export const projectInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(2000).nullable(),
  tech: z.array(z.string().trim().min(1).max(40)).max(20),
  coverUrl: z.string().trim().max(1000).nullable(),
  link: z.string().trim().max(500).nullable(),
  year: z.number().int().min(2000).max(2100).nullable(),
  published: z.boolean(),
  contributorIds: z.array(z.string().uuid()).max(50),
});

export const announcementInput = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(2).max(160),
    body: z.string().trim().min(2).max(5000),
    teamId: z.string().trim().max(40).nullable(),
    pinned: z.boolean(),
    published: z.boolean(),
    mediaUrl: z.string().trim().max(1000).nullable(),
    mediaType: z.enum(["image", "video"]).nullable(),
  })
  .superRefine((value, ctx) => {
    if ((value.mediaUrl && !value.mediaType) || (!value.mediaUrl && value.mediaType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Media URL and type must be provided together.",
      });
    }
  });

export const badgeAwardInput = z.object({
  memberId: z.string().uuid(),
  badgeId: z.string().trim().min(1).max(60),
  note: z.string().trim().max(200).nullable(),
});

export const mentorRequestInput = z.object({
  mentorId: z.string().uuid(),
  topic: z.string().trim().min(3).max(120),
  message: z.string().trim().max(1000).nullable(),
});

const hackathonPerson = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  gender: z.enum(["female", "male", "prefer_not_to_say"]),
  phone: z.string().trim().max(30).optional().default(""),
  srn: z.string().trim().max(40).optional().default(""),
  branch: z.string().trim().max(80).optional().default(""),
  year: z.string().trim().max(20).optional().default(""),
});

export const hackathonRegisterInput = z.object({
  name: z.string().trim().min(2).max(100),
  leadName: z.string().trim().min(2).max(100),
  leadEmail: z.string().trim().email().max(160),
  leadGender: z.enum(["female", "male", "prefer_not_to_say"]),
  leadPhone: z.string().trim().max(30).optional().default(""),
  leadSrn: z.string().trim().max(40).optional().default(""),
  leadBranch: z.string().trim().max(80).optional().default(""),
  leadYear: z.string().trim().max(20).optional().default(""),
  problemStatementId: z.string().trim().max(60).optional().default(""),
});

export const hackathonJoinInput = z.object({
  code: z.string().trim().min(4).max(20),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  gender: z.enum(["female", "male", "prefer_not_to_say"]),
  phone: z.string().trim().max(30).optional().default(""),
  srn: z.string().trim().max(40).optional().default(""),
  branch: z.string().trim().max(80).optional().default(""),
  year: z.string().trim().max(20).optional().default(""),
});

export const hackathonTeamUpdateInput = z.object({
  token: z.string().trim().min(10).max(120),
  name: z.string().trim().min(2).max(100),
  mentorName: z.string().trim().max(100).optional().default(""),
  mentorEmail: z.string().trim().max(160).optional().default(""),
  members: z
    .array(hackathonPerson.extend({ isLead: z.boolean() }))
    .max(10)
    .default([]),
});

export const hackathonSubmissionInput = z.object({
  token: z.string().trim().min(10).max(120),
  problemStatementId: z.string().trim().max(60).optional().default(""),
  problemStatementTitle: z.string().trim().max(200).optional().default(""),
  theme: z.string().trim().max(120).optional().default(""),
  solutionTitle: z.string().trim().max(160).optional().default(""),
  solutionSummary: z.string().trim().max(4000).optional().default(""),
  repositoryUrl: z.string().trim().url().max(500).or(z.literal("")).optional().default(""),
  demoUrl: z.string().trim().url().max(500).or(z.literal("")).optional().default(""),
  videoUrl: z.string().trim().url().max(500).or(z.literal("")).optional().default(""),
  deckPath: z.string().trim().max(500).optional().default(""),
  submit: z.boolean().default(false),
});

export const hackathonDeckUploadInput = z.object({
  token: z.string().trim().min(10).max(120),
  contentType: z.literal("application/pdf"),
  base64: z.string().min(16).max(14_000_000),
});

export const hackathonWorkspaceInput = z.object({
  registrationOpen: z.boolean(),
  submissionsOpen: z.boolean(),
  minTeamSize: z.number().int().min(1).max(10),
  maxTeamSize: z.number().int().min(1).max(10),
  rules: z.string().trim().max(8000).nullable(),
});

const sarvamTeamMemberInput = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(30).optional().default(""),
  usn: z.string().trim().max(40).optional().default(""),
  college: z.string().trim().max(160).optional().default(""),
  branch: z.string().trim().max(80).optional().default(""),
  year: z.string().trim().max(20).optional().default(""),
});

export const sarvamHackathonRegistrationInput = z.object({
  teamName: z.string().trim().min(2).max(100),
  members: z.array(sarvamTeamMemberInput).length(4),
  projectTitle: z.string().trim().min(2).max(160),
  track: z.enum([
    "Education and Learning",
    "Healthcare and well being",
    "Agriculture and rural Innovation",
    "Security and developer tools",
    "Open innovation",
  ]),
  problem: z.string().trim().min(20).max(1500),
  solution: z.string().trim().min(20).max(2000),
  innovation: z.string().trim().min(20).max(1500),
  aiUse: z.string().trim().min(20).max(1500),
  beneficiaries: z.string().trim().min(20).max(1500),
  originalityConfirmed: z.literal(true),
  rulesConfirmed: z.literal(true),
});

export const milestoneInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).nullable(),
  startsAt: z.string().trim().max(60).nullable(),
  endsAt: z.string().trim().max(60).nullable(),
  sortOrder: z.number().int().min(0).max(999),
  published: z.boolean(),
});

export const eventAnnouncementInput = z.object({
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().min(2).max(5000),
  pinned: z.boolean(),
  published: z.boolean(),
});

export const hackathonProblemStatementInput = z.object({
  id: z.string().uuid().optional(),
  statementCode: z.string().trim().min(2).max(80),
  title: z.string().trim().min(5).max(500),
  organization: z.string().trim().max(200).nullable(),
  category: z.string().trim().max(120).nullable(),
  theme: z.string().trim().max(160).nullable(),
  description: z.string().trim().max(12000).nullable(),
  sourceUrl: z.string().trim().url().max(500).nullable(),
  sourceVersion: z.string().trim().max(120).nullable(),
  published: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

export type HackathonRegisterInput = z.infer<typeof hackathonRegisterInput>;
export type HackathonJoinInput = z.infer<typeof hackathonJoinInput>;
export type HackathonTeamUpdateInput = z.infer<typeof hackathonTeamUpdateInput>;
export type HackathonSubmissionInput = z.infer<typeof hackathonSubmissionInput>;
export type HackathonWorkspaceInput = z.infer<typeof hackathonWorkspaceInput>;
export type MilestoneInput = z.infer<typeof milestoneInput>;
export type EventAnnouncementInput = z.infer<typeof eventAnnouncementInput>;
export type HackathonProblemStatementInput = z.infer<typeof hackathonProblemStatementInput>;

export type MemberInput = z.infer<typeof memberInput>;
export type EventInput = z.infer<typeof eventInput>;
export type ProjectInput = z.infer<typeof projectInput>;
export type AnnouncementInput = z.infer<typeof announcementInput>;
