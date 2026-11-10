import { HACKATHON_EMAIL, renderHackathonEmail, type ReviewEmailInput } from "./hackathonEmail";
import { generateFinaleGuide } from "./hackathon-guide.server";

export async function buildDecisionMessage(
  input: ReviewEmailInput & { email: string },
  makeGuide: () => Promise<Uint8Array> = generateFinaleGuide,
) {
  let attachments: { filename: string; content: string }[] | undefined;
  let guideMissing = false;
  if (input.status === "approved") {
    try {
      attachments = [
        {
          filename: HACKATHON_EMAIL.guideFilename,
          content: Buffer.from(await makeGuide()).toString("base64"),
        },
      ];
    } catch (error) {
      guideMissing = true;
      console.error(
        "Finale guide generation failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }
  return {
    guideMissing,
    payload: {
      from: process.env.FROM_EMAIL || "Vertex Club <events@abscissa.dev>",
      reply_to: process.env.EVENTS_REPLY_TO || "events@abscissa.dev",
      to: [input.email],
      ...renderHackathonEmail({ ...input, guideAttached: !guideMissing }),
      ...(attachments ? { attachments } : {}),
    },
  };
}
