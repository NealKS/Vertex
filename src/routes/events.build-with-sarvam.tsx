import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  ExternalLink,
  HeartPulse,
  Mail,
  MapPin,
  Plus,
  Scale,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wheat,
  X,
} from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { registerForSarvamHackathon } from "@/lib/sarvam.functions";

export const Route = createFileRoute("/events/build-with-sarvam")({
  head: () => ({
    meta: [
      { title: "BUILD WITH SARVAM — Vertex" },
      {
        name: "description",
        content:
          "BUILD WITH SARVAM is a Bengaluru-wide inter-college AI hackathon by Vertex Club, REVA University, in partnership with Sarvam AI.",
      },
    ],
  }),
  component: BuildWithSarvamPage,
});

type Member = {
  name: string;
  email: string;
  phone: string;
  usn: string;
  college: string;
  branch: string;
  year: string;
};

type TrackName =
  | "Education and Learning"
  | "Healthcare and well being"
  | "Agriculture and rural Innovation"
  | "Security and developer tools"
  | "Open innovation";

type ProjectDetails = {
  projectTitle: string;
  track: TrackName;
  problem: string;
  solution: string;
  innovation: string;
  aiUse: string;
  beneficiaries: string;
  originalityConfirmed: boolean;
  rulesConfirmed: boolean;
};

const createMember = (): Member => ({
  name: "",
  email: "",
  phone: "",
  usn: "",
  college: "",
  branch: "",
  year: "",
});

const createProject = (): ProjectDetails => ({
  projectTitle: "",
  track: "Education and Learning",
  problem: "",
  solution: "",
  innovation: "",
  aiUse: "",
  beneficiaries: "",
  originalityConfirmed: false,
  rulesConfirmed: false,
});

const tracks: { title: TrackName; summary: string; examples: string[]; icon: ReactNode }[] = [
  {
    title: "Education and Learning",
    summary: "Use AI to improve access to education and create better learning experiences.",
    examples: ["Personalised learning", "AI-powered study tools", "Regional-language support"],
    icon: <BookOpen size={19} />,
  },
  {
    title: "Healthcare and well being",
    summary:
      "Explore responsible applications that support healthcare access and general well-being.",
    examples: ["Information assistants", "Patient education", "Hospital navigation"],
    icon: <HeartPulse size={19} />,
  },
  {
    title: "Agriculture and rural Innovation",
    summary: "Address challenges faced by farmers and rural communities with practical AI.",
    examples: ["Farming support", "Crop and weather information", "Rural service access"],
    icon: <Wheat size={19} />,
  },
  {
    title: "Security and developer tools",
    summary: "Create safer systems and practical tools that help developers build with confidence.",
    examples: ["Security assistants", "Developer workflows", "Testing and monitoring"],
    icon: <Code2 size={19} />,
  },
  {
    title: "Open innovation",
    summary: "Explore an original AI idea that creates useful impact beyond the defined tracks.",
    examples: ["Emerging use cases", "Creative applications", "Community solutions"],
    icon: <Sparkles size={19} />,
  },
];

const evaluationCriteria = [
  [
    "Innovation and Originality",
    "25%",
    "How creative, distinctive, and original is the proposed idea?",
  ],
  ["Problem Relevance", "20%", "How clearly does the idea address a meaningful problem?"],
  [
    "Feasibility of the Proposed Solution",
    "20%",
    "Can the proposed solution realistically be developed and implemented?",
  ],
  [
    "Use of AI and Relevant Technology",
    "20%",
    "Is AI being used appropriately to solve the identified problem?",
  ],
  [
    "Potential Impact",
    "15%",
    "How useful could the solution be to its intended users or community?",
  ],
] as const;

const faqs = [
  [
    "Who can participate?",
    "Students from colleges across Bengaluru are invited to submit AI project ideas, subject to the final eligibility rules.",
  ],
  [
    "Is this an inter-college hackathon?",
    "Yes. Build with Sarvam is intended for students from different colleges across Bengaluru.",
  ],
  [
    "Do I need a working prototype to submit my idea?",
    "No prototype, presentation, or video is required for the initial idea-submission round unless the organisers announce otherwise.",
  ],
  [
    "What are the available tracks?",
    "Choose from Education and Learning, Healthcare and well being, Agriculture and rural Innovation, Security and developer tools, or Open innovation.",
  ],
  [
    "How will teams be selected?",
    "The organising team will evaluate ideas using the published criteria. Shortlisted Top 50 teams and team confirmations will be announced on 12 November.",
  ],
  [
    "Is using Sarvam AI mandatory?",
    "Final technology requirements will be announced by the organisers. Please check the official rules before submitting.",
  ],
  [
    "Are API credits or prizes available?",
    "The winner receives a 15K cash prize plus 25K API credits, and every participant receives 500 API credits. Terms and conditions apply.",
  ],
  ["How can I contact the organisers?", "Email the Vertex event desk at vertexreva@gmail.com."],
] as const;

function BuildWithSarvamPage() {
  const register = useServerFn(registerForSarvamHackathon);
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<Member[]>([createMember()]);
  const [project, setProject] = useState<ProjectDetails>(createProject());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ teamName: string; memberCount: number } | null>(
    null,
  );
  const isTeamComplete =
    members.length === 4 &&
    members.every((member) =>
      [
        member.name,
        member.email,
        member.phone,
        member.usn,
        member.college,
        member.branch,
        member.year,
      ].every((value) => value.trim().length > 0),
    );
  const isProjectComplete =
    project.projectTitle.trim().length > 0 &&
    project.problem.trim().length >= 20 &&
    project.solution.trim().length >= 20 &&
    project.innovation.trim().length >= 20 &&
    project.aiUse.trim().length >= 20 &&
    project.beneficiaries.trim().length >= 20 &&
    project.originalityConfirmed &&
    project.rulesConfirmed;
  const canSubmit = teamName.trim().length > 0 && isTeamComplete && isProjectComplete;

  const updateMember = (index: number, field: keyof Member, value: string) => {
    setMembers((current) =>
      current.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [field]: value } : member,
      ),
    );
  };

  const updateProject = <K extends keyof ProjectDetails>(field: K, value: ProjectDetails[K]) => {
    setProject((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (members.length !== 4) {
      toast.error("Add all 4 team members before submitting.");
      return;
    }
    if (!isProjectComplete) {
      toast.error("Complete the idea details and both declarations before submitting.");
      return;
    }
    const emails = members.map((member) => member.email.trim().toLowerCase());
    if (new Set(emails).size !== emails.length) {
      toast.error("Each team member must use a different email address.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await register({ data: { teamName, members, ...project } });
      setSubmitted({ teamName: result.teamName, memberCount: result.memberCount });
      window.scrollTo({
        top: document.getElementById("submit")?.offsetTop ?? 0,
        behavior: "smooth",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your idea.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteHeader />
      <main className="flex flex-col">
        <section className="order-1 relative overflow-hidden border-b border-hairline">
          <Atmosphere mesh />
          <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 md:pb-28 md:pt-28">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} /> Back to events
            </Link>
            <div className="mt-0 grid gap-10 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
              <div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.35fr)] items-center gap-2">
                  <div
                    className="inline-flex min-w-0 w-full flex-col items-center gap-1 rounded-lg border border-hairline bg-transparent px-2 py-3 text-center"
                    aria-label="Vertex logo"
                  >
                    <img
                      src="/vertex-logo-transparent.png"
                      alt="Vertex logo"
                      className="h-9 w-14 object-contain"
                      width={1536}
                      height={1024}
                      loading="eager"
                      decoding="async"
                    />
                    <span className="border-t border-black/15 pt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black/60">
                      Powered By
                    </span>
                  </div>
                  <span
                    className="self-center font-mono text-xs text-muted-foreground"
                    aria-hidden="true"
                  >
                    ×
                  </span>
                  <a
                    href="https://www.sarvam.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-w-0 w-full flex-col items-center gap-1 rounded-lg border border-hairline bg-transparent px-2 py-2 transition-transform hover:-translate-y-0.5"
                    aria-label="Sarvam AI website"
                  >
                    <img
                      src="/partners/sarvam-wordmark.png"
                      alt="Sarvam AI"
                      className="h-7 w-full max-w-[150px] object-contain"
                      width={631}
                      height={100}
                      loading="eager"
                      decoding="async"
                    />
                    <span className="border-t border-black/15 pt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black/60">
                      AI partner
                    </span>
                  </a>
                  <div
                    className="inline-flex min-w-0 w-full flex-col items-center gap-1 rounded-lg border border-hairline bg-transparent px-2 py-2 text-center"
                    aria-label="KrowdKraft AR community partner"
                  >
                    <img
                      src="/partners/krowdkraft-logo.png"
                      alt="KrowdKraft AR logo"
                      className="h-14 w-24 object-contain"
                      width={1080}
                      height={1440}
                      loading="eager"
                      decoding="async"
                    />
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black/60">
                      Community Partner
                    </span>
                  </div>
                  <div
                    className="inline-flex min-w-0 w-full flex-col items-center gap-1 rounded-lg border border-hairline bg-transparent px-2 py-2 text-center"
                    aria-label="REVA University host university"
                  >
                    <img
                      src="/partners/reva-university-logo-transparent.png"
                      alt="REVA University"
                      className="h-12 w-full max-w-[13rem] object-contain"
                      width={2048}
                      height={1152}
                      loading="eager"
                      decoding="async"
                    />
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black/60">
                      Host University
                    </span>
                  </div>
                </div>
                <p className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Bengaluru-wide inter-college AI hackathon · REVA University
                </p>
                <h1 className="mt-5 max-w-4xl font-display text-6xl font-semibold leading-[0.88] tracking-[-0.06em] sm:text-8xl">
                  Build with
                  <br />
                  <span className="text-silver-gradient">Sarvam.</span>
                </h1>
                <p className="mt-7 max-w-2xl font-display text-2xl italic leading-tight text-muted-foreground sm:text-3xl">
                  Build innovative AI solutions for real-world problems.
                </p>
                <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground">
                  Join students from colleges across Bengaluru, turn your idea into an impactful
                  project, and explore the possibilities of AI with Sarvam AI.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#submit"
                    className="btn-primary rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    Submit your idea <ArrowRight size={15} />
                  </a>
                  <a
                    href="#tracks"
                    className="btn-ghost rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    Explore tracks
                  </a>
                  <a
                    href="#rules"
                    className="btn-ghost rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest"
                  >
                    View rules
                  </a>
                </div>
              </div>

              <div id="event-desk" className="glass-panel edge-highlight rounded-2xl p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Event desk
                </div>
                <dl className="mt-5 grid gap-4 text-sm">
                  <DeskRow
                    icon={<CalendarDays size={15} />}
                    label="Finale"
                    value="13–14 November 2026"
                  />
                  <DeskRow
                    icon={<MapPin size={15} />}
                    label="Venue"
                    value="REVA University, Bengaluru"
                  />
                  <DeskRow
                    icon={<Users size={15} />}
                    label="Eligibility"
                    value="Students across Bengaluru"
                  />
                  <DeskRow icon={<Users size={15} />} label="Team size" value="Exactly 4 members" />
                  <DeskRow
                    icon={<Trophy size={15} />}
                    label="Winner"
                    value="15K cash prize + 25K API credits"
                  />
                  <DeskRow
                    icon={<Sparkles size={15} />}
                    label="Every participant"
                    value="500 API credits"
                  />
                  <DeskRow
                    icon={<ShieldCheck size={15} />}
                    label="Terms"
                    value="Terms and conditions apply"
                  />
                  <DeskRow
                    icon={<CalendarDays size={15} />}
                    label="Deadline"
                    value="10 November · 11 PM"
                  />
                </dl>
                <p className="mt-5 border-t border-hairline pt-4 text-xs leading-5 text-muted-foreground">
                  Prize, credit, and participation details are subject to the official event terms
                  and conditions.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="order-2 border-b border-hairline bg-surface-2">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 sm:grid-cols-3 md:py-10">
            <Stat label="BENGALURU-WIDE" detail="Inter-college participation" />
            <Stat label="5 TRACKS" detail="Choose one problem space" />
            <Stat label="13–14 NOV" detail="Offline grand finale" />
          </div>
        </section>

        <section
          id="about"
          className="order-3 mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[.75fr_1.25fr]"
        >
          <SectionIntro
            number="01"
            eyebrow="About the hackathon"
            title="Start with a problem worth solving."
          />
          <Reveal delay={0.1}>
            <div className="space-y-5 text-base leading-8 text-muted-foreground">
              <p>
                Build with Sarvam is a Bengaluru-wide inter-college AI hackathon organised by Vertex
                Club, REVA University, in partnership with Sarvam AI.
              </p>
              <p>
                The hackathon invites students to identify meaningful problems and propose
                innovative solutions using artificial intelligence. Participants submit their ideas
                online, after which selected teams will be invited to the offline grand finale at
                REVA University.
              </p>
              <p>
                The event aims to encourage innovation, collaboration, responsible AI development,
                and the creation of practical solutions with real-world impact.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Develop innovative AI solutions.",
                "Collaborate across colleges.",
                "Explore AI for real-world challenges.",
                "Present and demonstrate your idea.",
              ].map((objective) => (
                <div
                  key={objective}
                  className="flex gap-3 rounded-xl border border-hairline bg-surface-2 p-4 text-sm leading-6 text-muted-foreground"
                >
                  <CheckCircle2 className="mt-0.5 shrink-0 text-silver" size={17} />
                  <span>{objective}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="how-it-works" className="order-4 border-y border-hairline bg-surface-2">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <SectionIntro
              number="02"
              eyebrow="How it works"
              title="A clear path from idea to finale."
            />
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline md:grid-cols-3">
              <Phase
                number="01"
                title="Online idea submission"
                detail="Explain the problem, your proposed solution, what makes it different, how you plan to use AI, and who could benefit."
              />
              <Phase
                number="02"
                title="Shortlisting — Top 50 teams"
                detail="Submitted ideas will be evaluated by the organising and judging team. Shortlisted Top 50 teams and team confirmations will be announced on 12 November."
              />
              <Phase
                number="03"
                title="Offline grand finale"
                detail="Shortlisted teams will present or demonstrate their solutions at REVA University on November 13–14, 2026, following the final event instructions."
              />
            </div>
            <Notice>
              Top 50 selection, reporting instructions, and final participation requirements will be
              published only after organiser confirmation.
            </Notice>
          </div>
        </section>

        <section id="tracks" className="order-5 mx-auto max-w-6xl scroll-mt-20 px-6 py-16 md:py-24">
          <SectionIntro
            number="03"
            eyebrow="Hackathon tracks"
            title="Five ways to make AI matter."
            detail="Integrate Sarvam AI with your idea submission. Choose one track in the idea-submission form. These examples are starting points, not limits."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track, index) => (
              <TrackCard key={track.title} track={track} index={index} />
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Healthcare solutions must not make unsupported medical claims or replace qualified
            healthcare professionals.
          </p>
        </section>

        <section
          id="submit"
          className="order-11 scroll-mt-20 border-y border-hairline bg-surface-2"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[.7fr_1.3fr] lg:gap-16">
            <Reveal>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
                09 · Idea submission
              </p>
              <h2 className="mt-4 max-w-md font-display text-4xl tracking-tight sm:text-5xl">
                Make the problem legible. Make the idea memorable.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
                Have an innovative AI idea? Submit your proposal for Build with Sarvam. Explain the
                problem you want to solve, your proposed solution, and how AI can help you create a
                meaningful impact.
              </p>
              <div className="mt-8 grid gap-3">
                <Benefit
                  icon={<ShieldCheck size={16} />}
                  title="Secure submission"
                  detail="Participant contact details are stored privately for organiser review."
                />
                <Benefit
                  icon={<Scale size={16} />}
                  title="Responsible AI"
                  detail="Disclose relevant limitations and do not submit deceptive, harmful, or unauthorised content."
                />
                <Benefit
                  icon={<MapPin size={16} />}
                  title="Finale at REVA University"
                  detail="13–14 November 2026 · Bengaluru."
                />
              </div>
            </Reveal>

            <div className="min-w-0">
              {submitted ? (
                <div className="glass-strong rounded-2xl p-8 outline-none" role="status">
                  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-700">
                    <CheckCircle2 size={18} /> Idea received
                  </div>
                  <h3 className="mt-7 font-display text-4xl tracking-tight sm:text-5xl">
                    {submitted.teamName} is on the list.
                  </h3>
                  <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                    Your idea submission has been received with {submitted.memberCount} team member
                    {submitted.memberCount === 1 ? "" : "s"}. The organising team will review the
                    proposal and contact shortlisted teams using the details provided.
                  </p>
                  <p className="mt-5 border-l border-silver pl-4 text-sm leading-7 text-muted-foreground">
                    Thank you for submitting to Build with Sarvam.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(null);
                      setTeamName("");
                      setMembers([createMember()]);
                      setProject(createProject());
                    }}
                    className="btn-ghost mt-8 rounded-lg px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest"
                  >
                    Submit another idea <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={submit}
                  className="glass-panel edge-highlight rounded-2xl p-6 md:p-8"
                >
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-5">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
                        Submission form
                      </p>
                      <h3 className="mt-2 font-display text-2xl">
                        Tell us about the team and the idea
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      One idea per team
                    </span>
                  </div>
                  <label className="mt-6 flex flex-col gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Team name
                    </span>
                    <input
                      required
                      value={teamName}
                      onChange={(event) => setTeamName(event.target.value)}
                      placeholder="Give your team a name"
                      className="field-input rounded-lg px-3 py-2.5 text-sm"
                    />
                  </label>

                  <div className="mt-8 border-t border-hairline pt-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
                      Project information
                    </p>
                    <div className="mt-4 grid gap-4">
                      <TextField
                        label="Project title"
                        value={project.projectTitle}
                        required
                        onChange={(value) => updateProject("projectTitle", value)}
                      />
                      <label className="flex flex-col gap-1.5">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                          Hackathon track
                        </span>
                        <select
                          value={project.track}
                          onChange={(event) =>
                            updateProject("track", event.target.value as TrackName)
                          }
                          className="field-input rounded-lg px-3 py-2 text-sm"
                        >
                          {tracks.map((track) => (
                            <option key={track.title} value={track.title}>
                              {track.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <TextField
                        label="What problem are you trying to solve?"
                        hint="Recommended: 50–100 words"
                        value={project.problem}
                        required
                        multiline
                        onChange={(value) => updateProject("problem", value)}
                      />
                      <TextField
                        label="What is your proposed solution?"
                        hint="Recommended: 100–150 words"
                        value={project.solution}
                        required
                        multiline
                        onChange={(value) => updateProject("solution", value)}
                      />
                      <TextField
                        label="What makes your idea innovative or different?"
                        hint="Recommended: 50–100 words"
                        value={project.innovation}
                        required
                        multiline
                        onChange={(value) => updateProject("innovation", value)}
                      />
                      <TextField
                        label="How do you plan to use AI or Sarvam AI technology?"
                        hint="Recommended: 50–100 words"
                        value={project.aiUse}
                        required
                        multiline
                        onChange={(value) => updateProject("aiUse", value)}
                      />
                      <TextField
                        label="Who will benefit, and what impact could it create?"
                        hint="Recommended: 50–100 words"
                        value={project.beneficiaries}
                        required
                        multiline
                        onChange={(value) => updateProject("beneficiaries", value)}
                      />
                    </div>
                  </div>

                  <div className="mt-8 border-t border-hairline pt-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">
                      Team information
                    </p>
                    <div className="mt-4 grid gap-4">
                      {members.map((member, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-hairline bg-surface-2 p-4 md:p-5"
                        >
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <span className="font-mono text-[10px] uppercase tracking-widest text-silver">
                                Member {index + 1}
                                {index === 0 ? " · Team lead" : ""}
                              </span>
                              {index === 0 && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  The lead receives event-desk updates.
                                </p>
                              )}
                            </div>
                            {members.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setMembers((current) => current.filter((_, i) => i !== index))
                                }
                                className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                              >
                                <X size={13} /> Remove
                              </button>
                            )}
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <MemberField
                              label="Full name"
                              value={member.name}
                              required
                              onChange={(value) => updateMember(index, "name", value)}
                            />
                            <MemberField
                              label="Email"
                              type="email"
                              value={member.email}
                              required
                              onChange={(value) => updateMember(index, "email", value)}
                            />
                            <MemberField
                              label="Contact number"
                              type="tel"
                              value={member.phone}
                              required
                              onChange={(value) => updateMember(index, "phone", value)}
                            />
                            <MemberField
                              label="USN / SRN"
                              value={member.usn}
                              required
                              onChange={(value) => updateMember(index, "usn", value)}
                            />
                            <MemberField
                              label="College name"
                              value={member.college}
                              required
                              onChange={(value) => updateMember(index, "college", value)}
                            />
                            <MemberField
                              label="Branch"
                              value={member.branch}
                              required
                              onChange={(value) => updateMember(index, "branch", value)}
                            />
                            <MemberField
                              label="Year"
                              value={member.year}
                              required
                              onChange={(value) => updateMember(index, "year", value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <button
                      type="button"
                      disabled={members.length >= 4}
                      onClick={() => setMembers((current) => [...current, createMember()])}
                      className="btn-ghost rounded-lg px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={14} /> Add member
                    </button>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      {members.length}/4 member fields
                    </span>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-muted-foreground">
                    Add exactly 4 team members, with the team lead first. The lead receives
                    event-desk updates.
                  </p>
                  <div className="mt-7 grid gap-3 border-t border-hairline pt-6">
                    <Declaration
                      checked={project.originalityConfirmed}
                      onChange={(checked) => updateProject("originalityConfirmed", checked)}
                    >
                      I confirm that the information submitted is accurate and that this project
                      idea is original, or that my team has the necessary rights to use any included
                      material.
                    </Declaration>
                    <Declaration
                      checked={project.rulesConfirmed}
                      onChange={(checked) => updateProject("rulesConfirmed", checked)}
                    >
                      I have read and agree to follow the official Build with Sarvam hackathon
                      rules.
                    </Declaration>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !canSubmit}
                    className="btn-primary mt-7 w-full rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-widest disabled:opacity-50"
                  >
                    {submitting ? "Submitting idea…" : "Submit idea"} <ArrowRight size={15} />
                  </button>
                  <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    No prototype, PPT, or video is required for this initial round.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        <section id="rules" className="order-6 mx-auto max-w-6xl scroll-mt-20 px-6 py-16 md:py-24">
          <SectionIntro
            number="04"
            eyebrow="Rules & regulations"
            title="Build responsibly. Be clear about your work."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <RuleCard
              title="Eligibility"
              items={[
                "Students from colleges across Bengaluru may submit their ideas.",
                "Participants must provide accurate academic and contact information.",
                "Teams must have exactly 4 members.",
              ]}
            />
            <RuleCard
              title="Originality & intellectual property"
              items={[
                "Submit original ideas or properly acknowledge existing work.",
                "Plagiarism, copied submissions, and unauthorised use of another person's intellectual property may result in disqualification.",
                "Teams retain ownership of their original work, subject to applicable law and third-party licences.",
              ]}
            />
            <RuleCard
              title="AI usage"
              items={[
                "Teams may propose solutions involving AI technologies.",
                "Final requirements for using Sarvam AI technology will be communicated by the organisers.",
                "Use AI responsibly, disclose relevant limitations, and do not create deceptive, harmful, or unauthorised content.",
              ]}
            />
            <RuleCard
              title="Shortlisting & conduct"
              items={[
                "The organisers will evaluate submissions using the announced criteria.",
                "The Top 50 teams will be contacted using the details provided.",
                "Participants must behave respectfully toward other teams, judges, mentors, volunteers, and organisers.",
              ]}
            />
          </div>
          <Notice>
            Prize and API-credit terms apply subject to the official event terms and conditions.
          </Notice>
        </section>

        <section id="evaluation" className="order-7 border-y border-hairline bg-surface-2">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <SectionIntro
              number="05"
              eyebrow="Evaluation criteria"
              title="What makes an idea stand out."
              detail="The weightings below are proposed evaluation criteria and must be approved before being published as official."
            />
            <div className="mt-12 grid gap-4 md:grid-cols-5">
              {evaluationCriteria.map(([title, weight, detail]) => (
                <div key={title} className="surface-card rounded-xl p-5">
                  <div className="font-mono text-3xl tracking-tight text-silver">{weight}</div>
                  <h3 className="mt-6 font-display text-xl leading-tight">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="partner"
          className="order-8 mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[.75fr_1.25fr]"
        >
          <SectionIntro
            number="06"
            eyebrow="Sarvam AI partnership"
            title="Powered by innovation. Built with Sarvam."
          />
          <Reveal delay={0.1}>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              Sarvam AI is the AI partner for Build with Sarvam, supporting participants who want to
              explore AI-powered solutions grounded in Indian languages, voice, and context.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <a
                href="https://docs.sarvam.ai/"
                target="_blank"
                rel="noreferrer"
                className="surface-card rounded-xl p-5"
              >
                <div className="flex items-center justify-between text-silver">
                  <BookOpen size={19} />
                  <ExternalLink size={15} />
                </div>
                <div className="mt-5 font-display text-xl">Official documentation</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Explore Sarvam AI documentation and follow organiser instructions for registration
                  and usage.
                </p>
              </a>
              <div className="surface-card rounded-xl p-5">
                <div className="flex items-center justify-between text-silver">
                  <ShieldCheck size={19} />
                  <span className="font-mono text-[9px] uppercase tracking-widest">Branding</span>
                </div>
                <div className="mt-5 font-display text-xl">Use official assets</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sarvam logos and wordmarks are displayed using the supplied official asset. Do not
                  redraw, stretch, recolour, or modify the logo.
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Winner and participant credit details are listed above. Redemption instructions and
              eligibility conditions will follow the official event terms and conditions.
            </p>
          </Reveal>
        </section>

        <section id="timeline" className="order-9 border-y border-hairline bg-surface-2">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
            <SectionIntro number="07" eyebrow="Event timeline" title="Two confirmed finale days." />
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              <TimelineCard
                date="13 November 2026"
                title="Grand Finale — Day 1"
                detail="Offline finale at REVA University, Bengaluru."
              />
              <TimelineCard
                date="14 November 2026"
                title="Grand Finale — Day 2"
                detail="Offline finale at REVA University, Bengaluru."
              />
            </div>
            <Notice>
              The submission deadline is 10 November · 11 PM. Team confirmation and shortlisted
              teams will be announced on 12 November.
            </Notice>
          </div>
        </section>

        <section id="faqs" className="order-10 mx-auto max-w-6xl scroll-mt-20 px-6 py-16 md:py-24">
          <SectionIntro
            number="08"
            eyebrow="Frequently asked questions"
            title="The useful answers, in one place."
          />
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {faqs.map(([question, answer]) => (
              <details
                key={question}
                className="group rounded-xl border border-hairline bg-surface-2 p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl">
                  <span>{question}</span>
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-silver transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          id="contact"
          className="order-12 mx-auto max-w-6xl scroll-mt-20 px-6 pb-16 md:pb-24"
        >
          <div className="flex flex-col gap-5 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-silver">
                Questions?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Reach the VERTEX event desk at vertexreva@gmail.com.
              </p>
            </div>
            <a
              href="mailto:vertexreva@gmail.com?subject=BUILD%20WITH%20SARVAM"
              className="btn-ghost rounded-lg px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest"
            >
              <Mail size={14} /> Contact the desk
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function DeskRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-5">
      <dt className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="max-w-[180px] text-right">{value}</dd>
    </div>
  );
}

function Stat({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="border-l border-hairline pl-4">
      <div className="font-mono text-xs tracking-[0.18em] text-silver">{label}</div>
      <div className="mt-1 text-sm text-muted-foreground">{detail}</div>
    </div>
  );
}

function SectionIntro({
  number,
  eyebrow,
  title,
  detail,
}: {
  number: string;
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  return (
    <Reveal>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-silver">
        {number} · {eyebrow}
      </p>
      <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
        {title}
      </h2>
      {detail && <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">{detail}</p>}
    </Reveal>
  );
}

function Phase({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <article className="bg-background p-6 md:p-7">
      <div className="font-mono text-xs tracking-[0.2em] text-silver">PHASE {number}</div>
      <h3 className="mt-8 font-display text-2xl leading-tight">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">{detail}</p>
    </article>
  );
}

function TrackCard({ track, index }: { track: (typeof tracks)[number]; index: number }) {
  return (
    <article className="surface-card rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-silver">
          {track.icon}
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
          0{index + 1}
        </span>
      </div>
      <h3 className="mt-7 font-display text-2xl leading-tight">{track.title}</h3>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">{track.summary}</p>
      <ul className="mt-6 grid gap-2 border-t border-hairline pt-4">
        {track.examples.map((example) => (
          <li key={example} className="flex gap-2 text-xs leading-5 text-muted-foreground">
            <Check size={14} className="mt-0.5 shrink-0 text-silver" />
            {example}
          </li>
        ))}
      </ul>
    </article>
  );
}

function RuleCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="surface-card rounded-2xl p-6">
      <div className="flex items-center gap-3 text-silver">
        <ShieldCheck size={18} />
        <h3 className="font-display text-2xl text-foreground">{title}</h3>
      </div>
      <ul className="mt-6 grid gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-7 text-muted-foreground">
            <Check size={15} className="mt-1 shrink-0 text-silver" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function TimelineCard({ date, title, detail }: { date: string; title: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-hairline bg-background p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver">{date}</div>
      <h3 className="mt-6 font-display text-2xl">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{detail}</p>
    </article>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="mt-8 flex gap-3 rounded-xl border border-silver/30 bg-surface-2 p-4 text-sm leading-6 text-muted-foreground">
      <ShieldCheck className="mt-0.5 shrink-0 text-silver" size={17} />
      <span>{children}</span>
    </div>
  );
}

function Benefit({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-hairline bg-surface-2 p-4">
      <span className="mt-0.5 text-silver">{icon}</span>
      <div>
        <div className="text-sm">{title}</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</div>
      </div>
    </div>
  );
}

function TextField({
  label,
  hint,
  value,
  onChange,
  multiline = false,
  required = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        {hint && (
          <span className="normal-case tracking-normal text-muted-foreground/70">{hint}</span>
        )}
      </span>
      {multiline ? (
        <textarea
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="field-input resize-y rounded-lg px-3 py-2 text-sm leading-6"
        />
      ) : (
        <input
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field-input rounded-lg px-3 py-2 text-sm"
        />
      )}
    </label>
  );
}

function Declaration({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer gap-3 text-sm leading-6 text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 accent-[var(--accent)]"
      />
      {children}
    </label>
  );
}

function MemberField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-input rounded-lg px-3 py-2 text-sm"
      />
    </label>
  );
}
