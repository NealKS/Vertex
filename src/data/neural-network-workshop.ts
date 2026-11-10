export const NEURAL_NETWORK_WORKSHOP = {
  slug: "neural-networks-from-scratch",
  title: "Neural Networks from Scratch: The Math Behind the Magic",
  type: "Workshop",
  date: "6 November 2026",
  dateIso: "2026-11-06",
  startsAt: "2026-11-06T08:30:00+05:30",
  endsAt: "2026-11-06T12:30:00+05:30",
  time: "8:30 AM to 12:30 PM",
  venue: "CNR Rao Seminar Hall, CV Raman Block, REVA University, Bengaluru",
  speaker: "Mohammed Tasawuff",
  organizedBy: "Vertex Club, REVA University",
  description:
    "A focused workshop on the mathematics behind neural networks, from the first principles to the intuition that makes the magic click.",
} as const;

export const NEURAL_NETWORK_ATTEND_REASONS = [
  "Attendance",
  "Something new to learn",
  "Already into neural networks, want to clarify / solidify concepts",
  "Already know this, just want to revise",
] as const;

export const NEURAL_NETWORK_WORKSHOP_YEARS = ["1st Year", "2nd Year", "3rd Year"] as const;

export type NeuralNetworkAttendReason = (typeof NEURAL_NETWORK_ATTEND_REASONS)[number];
