export type HackathonTrack = {
  id: string;
  name: string;
  organization: string;
  description: string;
  status: "Open" | "Upcoming" | "Confirmed";
  submissionRequirements: string[];
  judgingCriteria: string[];
  resources: Array<{ label: string; href: string }>;
};

export type HackathonPhase = {
  id: string;
  name: string;
  phaseNumber: number;
  type: "online" | "onsite";
  status: "Upcoming" | "Active" | "Completed";
  startDate: string;
  endDate: string;
  venue: string;
  description: string;
  requirements: string[];
  attendanceRequirements?: string[];
  checkInInstructions?: string;
  onlineLinks?: Array<{ label: string; href: string }>;
};

export type HackathonRule = {
  id: string;
  category: "eligibility" | "team-size" | "submissions" | "code-of-conduct" | "judging";
  title: string;
  content: string;
};

export type HackathonTheme = {
  id: string;
  title: string;
  description: string;
  track: string;
  technologies: string[];
};

export type HackathonProblemStatement = {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  requirements: string[];
  deliverables: string[];
  evaluationCriteria: string[];
};

export type HackathonResult = {
  id: string;
  track: string;
  participantOrTeam: string;
  award: string;
  position: string;
  status: "draft" | "published" | "archived";
  summary: string;
  projectTitle?: string;
};

export type HackathonRegistration = {
  id: string;
  registrationType: "individual" | "team";
  participantName: string;
  email: string;
  phone?: string;
  collegeOrUsn?: string;
  teamName?: string;
  teamSize?: number;
  teamMembers?: Array<{ name: string; email: string }>;
  track: string;
  registeredAt: string;
  status: "confirmed" | "waitlisted" | "in_review";
};

export type HackathonAnnouncement = {
  id: string;
  title: string;
  content: string;
  published: boolean;
  date: string;
};

export type HackathonFaq = {
  id: string;
  question: string;
  answer: string;
  category: "eligibility" | "format" | "submissions" | "mentorship";
};

export const hackathonWorkspaceData = {
  id: "vertex-global-hackathon-2026",
  title: "Vertex Global Hackathon 2026",
  slug: "hackathon-workspace",
  banner: "/sih-2026-logo.png",
  description:
    "A shared innovation sprint bringing together four tracks, online and on-site execution, and a single unified community workspace for participants, mentors, and organizers.",
  registrationStatus: "Open" as "Open" | "Closed",
  registrationDeadline: "14 October 2026",
  startDate: "16 October 2026",
  endDate: "18 October 2026",
  eventDateLabel: "16–18 October 2026",
  eventObjective:
    "Create an inclusive, multidisciplinary hackathon experience that blends AI, product engineering, systems intelligence, and real-world impact across four collaborative tracks.",
  organizations: ["Sarvam AI", "Abscissa", "Open Innovation", "Partner TBA"],
  announcementLead:
    "Workspace updates appear here in real time as mentorship schedules, track briefs, and judging rubrics are confirmed.",
  tracks: [
    {
      id: "sarvam-ai",
      name: "SARVAM AI",
      organization: "Sarvam AI",
      description:
        "Build AI-native solutions for language understanding, voice interfaces, automation, and applied intelligence with a strong emphasis on real-world Indian context and accessibility.",
      status: "Confirmed",
      submissionRequirements: [
        "Functional working code repository with open-source license or clear README setup instructions.",
        "A 3-minute video walkthrough showcasing the live AI interaction and conversational flow.",
        "Architecture diagram highlighting the model integration, latency benchmarks, and fallback strategies.",
      ],
      judgingCriteria: [
        "AI Innovation & Multilingual Context (30%)",
        "Technical Architecture & Latency Efficiency (25%)",
        "User Experience & Conversational Fluidity (25%)",
        "Practical Feasibility & Impact (20%)",
      ],
      resources: [
        { label: "Sarvam AI Documentation", href: "https://www.sarvam.ai/" },
        { label: "Indic Language Models API", href: "https://www.sarvam.ai/" },
      ],
    },
    {
      id: "abscissa",
      name: "ABSCISSA",
      organization: "Abscissa",
      description:
        "Solve high-throughput data, analytics, observability, and infrastructure problems through decision-support systems, operational telemetry, and workflow tooling.",
      status: "Confirmed",
      submissionRequirements: [
        "Live interactive dashboard or web console with seeded test data.",
        "Data schema documentation detailing data models, query optimization, and aggregation pipelines.",
        "Short writeup explaining how the system guides high-stakes decision making.",
      ],
      judgingCriteria: [
        "Analytical Depth & Data Accuracy (30%)",
        "System Reliability & Scalability (25%)",
        "Visualization & Decision Usability (25%)",
        "Business Value & Implementation Clarity (20%)",
      ],
      resources: [
        { label: "Abscissa Developer Portal", href: "https://abscissa.in/" },
        { label: "Data Pipeline Playbook", href: "https://abscissa.in/" },
      ],
    },
    {
      id: "open-innovation",
      name: "OPEN INNOVATION",
      organization: "Open Innovation",
      description:
        "Explore open-ended, domain-agnostic product ideas spanning Web3, climate tech, developer tooling, campus life, and assistive technologies with tangible user value.",
      status: "Open",
      submissionRequirements: [
        "Working software or hardware prototype with an end-to-end interactive demo.",
        "User empathy validation or problem discovery notes from user interviews.",
        "Slide deck (max 8 slides) covering problem, solution, architecture, and roadmap.",
      ],
      judgingCriteria: [
        "Originality & Creative Problem Solving (30%)",
        "Prototype Completeness & Execution (30%)",
        "User Empathy & Problem Validation (20%)",
        "Presentation & Pitch Clarity (20%)",
      ],
      resources: [
        { label: "Vertex Project Incubator", href: "/projects" },
        { label: "Open Source Toolkit", href: "https://github.com" },
      ],
    },
    {
      id: "to-be-announced",
      name: "TO BE ANNOUNCED",
      organization: "Partner Organization TBA",
      description:
        "This track is reserved for our incoming industry partner. Details, challenge statements, and partner mentors will be published prior to the hackathon kickoff.",
      status: "Upcoming",
      submissionRequirements: [
        "Placeholder: Track-specific submission criteria will be released once the collaborating partner is confirmed.",
        "Standard submission: GitHub repository, demo video, and architecture documentation.",
      ],
      judgingCriteria: [
        "Problem Alignment with Track Partner Brief (30%)",
        "Technical Depth & Quality (30%)",
        "Usability & Design (20%)",
        "Impact & Feasibility (20%)",
      ],
      resources: [
        { label: "Public Event Documentation", href: "/events/hackathon-workspace" },
        { label: "Organizer Contact for Sponsors", href: "mailto:vertex@reva.edu.in" },
      ],
    },
  ] as HackathonTrack[],
  phases: [
    {
      id: "online-phase",
      name: "Phase 1: Online Sprint",
      phaseNumber: 1,
      type: "online",
      status: "Active",
      startDate: "01 October 2026",
      endDate: "12 October 2026",
      venue: "Virtual / Remote (Discord & GitHub)",
      description:
        "Teams formulate hypotheses, conduct user discovery, and submit initial design documents, concept notes, and milestone prototypes across their selected track.",
      requirements: [
        "Complete online registration before the deadline (14 Oct 2026).",
        "Join the official Vertex Discord channel for mentor office hours.",
        "Submit concept brief and repository link by Phase 1 cutoff.",
      ],
      onlineLinks: [
        { label: "Discord Community", href: "https://discord.com" },
        { label: "Phase 1 Submission Portal", href: "#registration" },
      ],
    },
    {
      id: "onsite-phase",
      name: "Phase 2: On-Site Grand Finale",
      phaseNumber: 2,
      type: "onsite",
      status: "Upcoming",
      startDate: "16 October 2026",
      endDate: "18 October 2026",
      venue: "REVA University Campus (Auditorium & Lab Block)",
      description:
        "36 hours of non-stop hacking, in-person mentor checkpoints, live code review, and final pitch stage before the executive judging panel.",
      requirements: [
        "Shortlisted teams receive confirmation passes with unique QR entry badges.",
        "Physical presence of registered team members is mandatory during evaluation.",
        "Bring college ID, laptops, and required hardware peripherals.",
      ],
      attendanceRequirements: [
        "All team members must check in at the reception desk by 08:30 AM on 16 October 2026.",
        "Continuous on-site presence during mentor sprint checkpoints.",
      ],
      checkInInstructions:
        "Present your Hackathon Registration QR pass and college ID at the Main Auditorium entrance desk. Team kits and hackathon wristbands will be issued upon check-in.",
    },
  ] as HackathonPhase[],
  rules: [
    {
      id: "rules-eligibility",
      category: "eligibility",
      title: "Eligibility",
      content:
        "Open to undergraduate and postgraduate students from recognized universities and colleges. Cross-college teams and multidisciplinary teams (engineers, designers, product minds) are welcomed.",
    },
    {
      id: "rules-team-size",
      category: "team-size",
      title: "Team Size & Formation",
      content:
        "Teams may consist of 2 to 4 members. Solo participants can register individually and will be matched during the team-formation mixer in Phase 1.",
    },
    {
      id: "rules-submissions",
      category: "submissions",
      title: "Submission Guidelines",
      content:
        "All code must be authored during the hackathon sprint. Use of open-source libraries and APIs is encouraged; however, pre-built proprietary applications will result in disqualification.",
    },
    {
      id: "rules-code-of-conduct",
      category: "code-of-conduct",
      title: "Code of Conduct",
      content:
        "Vertex upholds an inclusive, harassment-free environment. Respect fellow participants, mentors, and event staff. Any form of discrimination, academic dishonesty, or disruptive behavior will lead to immediate removal.",
    },
    {
      id: "rules-judging",
      category: "judging",
      title: "Judging Criteria & Rubric",
      content:
        "Evaluations are conducted objectively across four dimensions: Impact & Originality (30%), Technical Execution & Architecture (30%), Design & Usability (20%), and Presentation & Q&A (20%).",
    },
  ] as HackathonRule[],
  themes: [
    {
      id: "theme-ai-product",
      title: "AI for Everyday Accessibility",
      description:
        "Create AI-backed products that improve access, voice interaction, local language productivity, and public service delivery with clear user outcomes.",
      track: "SARVAM AI",
      technologies: ["Python", "Indic-LLMs", "FastAPI", "Web Audio API", "PyTorch"],
    },
    {
      id: "theme-data-intelligence",
      title: "Operational Decision Intelligence",
      description:
        "Design systems that turn continuous operational, analytical, and telemetry signals into resilient automated decision-support workflows.",
      track: "ABSCISSA",
      technologies: ["PostgreSQL", "Timescale", "ClickHouse", "React Query", "Tailwind CSS"],
    },
    {
      id: "theme-open-innovation",
      title: "Sustainable Campus & Community Tech",
      description:
        "Prototype meaningful software or IoT solutions addressing campus logistics, resource management, peer learning, or social impact.",
      track: "OPEN INNOVATION",
      technologies: ["Next.js / Vite", "Supabase", "TypeScript", "Tailwind CSS", "IoT / ESP32"],
    },
    {
      id: "theme-configurable",
      title: "Emerging Tech Challenge (TBA)",
      description:
        "Theme and challenge statements for this track will be assigned and updated live once the collaborating industry partner is announced.",
      track: "TO BE ANNOUNCED",
      technologies: ["Cloud Native", "Security", "Distributed Systems", "To be assigned"],
    },
  ] as HackathonTheme[],
  problemStatements: {
    "sarvam-ai": [
      {
        id: "sarvam-ps-1",
        title: "Voice-First Multilingual Assistant for Rural Healthcare",
        description:
          "Create a conversational voice assistant that enables community healthcare workers and citizens to query medical FAQs, triage symptoms, and navigate health benefits in regional languages with zero typing barrier.",
        objectives: [
          "Eliminate literacy and typing barriers in accessing vital healthcare triage.",
          "Deliver sub-second response times using Indic speech-to-text and lightweight LLMs.",
          "Provide structured action cards alongside audio playback for clear clinical guidance.",
        ],
        requirements: [
          "Support at least 2 Indian regional languages alongside English.",
          "Provide voice input/output streaming with graceful offline audio caching.",
          "Implement medical disclaimer safeguards and confidence threshold filtering.",
        ],
        deliverables: [
          "Interactive web or mobile prototype with microphone input.",
          "Benchmark report showing latency across audio processing steps.",
          "GitHub repository with clear installation and deployment guide.",
        ],
        evaluationCriteria: [
          "Language naturalness and accuracy of speech recognition.",
          "End-to-end response latency and UX feedback indicators.",
          "Safety railings and clinical triage escalation handling.",
        ],
      },
      {
        id: "sarvam-ps-2",
        title: "Indic Agentic Workflow Engine for Local MSMEs",
        description:
          "Build an AI workflow agent that accepts voice notes or text receipts in regional languages and automatically reconciles bookkeeping entries, inventory records, and invoice generation for small merchants.",
        objectives: [
          "Automate unstructured inventory and transaction logging via natural speech.",
          "Support colloquial, code-mixed language input commonly used in commerce.",
        ],
        requirements: [
          "Parse code-mixed inputs (e.g. Hinglish, Tanglish) into structured JSON schema.",
          "Provide an exportable ledger view compatible with standard spreadsheet formats.",
        ],
        deliverables: [
          "Working application demonstrating speech-to-ledger reconciliation.",
          "Architecture document demonstrating prompt grounding and error mitigation.",
        ],
        evaluationCriteria: [
          "Entity extraction accuracy from vernacular speech.",
          "System robustness against ambiguous quantities or prices.",
        ],
      },
    ],
    abscissa: [
      {
        id: "abscissa-ps-1",
        title: "Real-Time Telemetry & Supply Chain Observability Console",
        description:
          "Build an anomaly-detection and decision-support dashboard that ingests high-volume logistical telemetry, flags shipment bottlenecks, and recommends rerouting actions in real time.",
        objectives: [
          "Surface critical operational bottlenecks from live data streams within 5 seconds.",
          "Provide actionable decision prompts rather than passive graph visualizations.",
        ],
        requirements: [
          "Interactive dashboard with filtering by region, transport node, and risk score.",
          "Simulated live data stream feeding time-series visualizations.",
          "Explainable alert mechanism highlighting root causes of delivery delays.",
        ],
        deliverables: [
          "Live responsive web application with real-time stream simulation.",
          "Database schema and query benchmarking writeup.",
          "Brief narrative walking through an operational incident resolution.",
        ],
        evaluationCriteria: [
          "Dashboard responsiveness under simulated high-throughput data loads.",
          "Clarity of telemetry visualization and visual hierarchy.",
          "Practical utility of recommended rerouting decisions.",
        ],
      },
    ],
    "open-innovation": [
      {
        id: "open-innovation-ps-1",
        title: "Peer-to-Peer Campus Skill & Project Matching Grid",
        description:
          "Design a zero-friction platform connecting campus developers, designers, and domain specialists for hackathons, capstones, and open-source collaborations based on verified skill graph signals.",
        objectives: [
          "Bridge the gap between developers looking for designers and vice versa.",
          "Encourage interdisciplinary team formation through skill endorsements.",
        ],
        requirements: [
          "Smart recommendation matching based on complementary tech stacks.",
          "Instant messaging or invite-request flow with project showcase cards.",
        ],
        deliverables: [
          "Full-stack web application with responsive UI.",
          "User journey maps and validation test results from student peers.",
        ],
        evaluationCriteria: [
          "UX fluidity and aesthetic polish.",
          "Matching algorithm relevance and practicality.",
          "Completeness of the team formation loop.",
        ],
      },
    ],
    "to-be-announced": [
      {
        id: "track4-ps-placeholder",
        title: "Track 4 Industry Partner Challenge (Placeholder)",
        description:
          "The official challenge statement for this track will be activated once our collaborating industry partner is announced by the Vertex organizing committee. Teams may prepare flexible modern full-stack architectures.",
        objectives: [
          "Maintain readiness for rapid adaptation once the partner brief is released.",
          "Prepare modular application scaffolds capable of integrating partner APIs.",
        ],
        requirements: [
          "Document team competencies and target problem domain.",
          "Adhere to partner-specific API constraints upon release.",
        ],
        deliverables: [
          "Initial technical blueprint and concept scaffold.",
          "Slide deck presenting team approach to agile delivery.",
        ],
        evaluationCriteria: [
          "Adaptability and speed of execution.",
          "Architectural cleanliness and modularity.",
        ],
      },
    ],
  } as Record<string, HackathonProblemStatement[]>,
  results: [] as HackathonResult[],
  announcements: [
    {
      id: "ann-1",
      title: "Sarvam AI API Access Tokens Dispatched",
      content:
        "All registered teams in the Sarvam AI track receive Indic API credentials via email upon registration confirmation.",
      published: true,
      date: "08 Oct 2026",
    },
    {
      id: "ann-2",
      title: "Phase 1 Submission Cutoff Extended by 6 Hours",
      content:
        "To accommodate university mid-term schedules, Phase 1 concept note submissions close at 11:59 PM on 12 October.",
      published: true,
      date: "09 Oct 2026",
    },
    {
      id: "ann-3",
      title: "Draft Judging Rubrics Under Internal Review",
      content:
        "Mentor scoring criteria are currently in review with track leads and will be finalized before Phase 2 commences.",
      published: false,
      date: "10 Oct 2026",
    },
  ] as HackathonAnnouncement[],
  faqs: [
    {
      id: "faq-eligibility",
      category: "eligibility",
      question: "Who is eligible to participate in the Vertex Global Hackathon 2026?",
      answer:
        "Undergraduate and postgraduate students enrolled in recognized universities and technical institutes are eligible. Cross-college and multidisciplinary teams (combining software engineering, UI/UX design, data science, and domain expertise) are fully supported.",
    },
    {
      id: "faq-team-size",
      category: "eligibility",
      question: "What are the team size constraints? Can I register individually?",
      answer:
        "Teams can consist of 2 to 4 builders. Solo participants are also welcome to register individually; our team-formation mixer on Discord during Phase 1 will assist in matching solo builders with complementary teams.",
    },
    {
      id: "faq-tracks",
      category: "format",
      question: "What are the four participating tracks, and can our team change tracks?",
      answer:
        "The tracks are: 1) SARVAM AI (multilingual Indic speech and AI products), 2) ABSCISSA (data systems, real-time observability, and decision intelligence), 3) OPEN INNOVATION (open-domain software, climate, Web3, and campus tech), and 4) Track 4 (Industry Partner Track, with problem statements published prior to kickoff). Each team focuses on one track for judging.",
    },
    {
      id: "faq-two-phases",
      category: "format",
      question: "How do the online and on-site phases connect?",
      answer:
        "Phase 1 (01–12 October 2026) is a virtual sprint conducted on Discord and GitHub for ideation, concept prototyping, and mentor checkpoints. Shortlisted finalist teams advance to Phase 2 (16–18 October 2026) for the 36-hour physical hackathon and pitch finale on the REVA University campus.",
    },
    {
      id: "faq-fees",
      category: "eligibility",
      question: "Is there any registration fee or cost to enter?",
      answer:
        "No. Participation in the Vertex Global Hackathon 2026 is completely free of cost for all student participants.",
    },
    {
      id: "faq-submissions",
      category: "submissions",
      question: "What are the submission deliverables required for evaluation?",
      answer:
        "Teams must provide a public or shared GitHub repository with a detailed setup guide, a 3-minute video walkthrough demonstrating functionality, and a brief architectural design document explaining system components.",
    },
    {
      id: "faq-mentorship",
      category: "mentorship",
      question: "How will mentor reviews and office hours be scheduled?",
      answer:
        "Mentors from Sarvam AI, Abscissa, and Vertex will host scheduled Discord office hours during Phase 1 to review solution designs, and will provide in-person code reviews during Phase 2 sprint checkpoints.",
    },
  ] as HackathonFaq[],
};

export const hackathonPublicEvent = {
  id: hackathonWorkspaceData.id,
  title: hackathonWorkspaceData.title,
  slug: hackathonWorkspaceData.slug,
  description: hackathonWorkspaceData.description,
  registrationDeadline: hackathonWorkspaceData.registrationDeadline,
  registrationStatus: hackathonWorkspaceData.registrationStatus,
  eventDate: hackathonWorkspaceData.eventDateLabel,
  location: "REVA University • Virtual & On-Site",
  tag: "Hackathon",
  coverUrl: hackathonWorkspaceData.banner,
  tracks: hackathonWorkspaceData.tracks.map((track) => track.name),
  phases: hackathonWorkspaceData.phases.map((phase) => phase.name),
};
