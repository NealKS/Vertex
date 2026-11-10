import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "rolldown";
import { PDFDocument } from "pdf-lib";
const dir = await mkdtemp(join(tmpdir(), "vertex-live-message-"));
try {
  const file = join(dir, "message.mjs");
  await build({
    input: "src/lib/hackathon-message.server.ts",
    platform: "node",
    output: { file, format: "esm" },
  });
  const { buildDecisionMessage } = await import(pathToFileURL(file).href);
  const input = {
    title: "Safe <project>",
    team: "Test team",
    leader: "Leader",
    email: "leader@example.test",
    status: "approved",
  };
  const approved = await buildDecisionMessage(input);
  assert.deepEqual(approved.payload.to, [input.email]);
  assert.equal(approved.guideMissing, false);
  assert.equal(approved.payload.attachments.length, 1);
  assert.equal(approved.payload.attachments[0].filename, "Build-With-Sarvam-Finale-Guide.pdf");
  const bytes = Buffer.from(approved.payload.attachments[0].content, "base64");
  assert.match(bytes.subarray(0, 8).toString(), /%PDF-/);
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() >= 3 && pdf.getPageCount() <= 4);
  for (const page of pdf.getPages()) assert.ok(Math.abs(page.getWidth() - 595.28) < 1);
  if (process.env.GUIDE_REVIEW_PATH) await writeFile(process.env.GUIDE_REVIEW_PATH, bytes);
  const rejected = await buildDecisionMessage({ ...input, status: "rejected" }, () => {
    throw Error("Must not generate a rejection PDF");
  });
  assert.equal(rejected.guideMissing, false);
  assert.equal(rejected.payload.attachments, undefined);
  const fallback = await buildDecisionMessage(input, async () => {
    throw Error("Expected PDF failure test");
  });
  assert.equal(fallback.guideMissing, true);
  assert.equal(fallback.payload.attachments, undefined);
  assert.match(fallback.payload.text, /could not be attached/);
  assert.doesNotMatch(fallback.payload.text, /in the attached PDF/);
  console.log(
    `Runtime PDF (${pdf.getPageCount()} A4 pages), leader-only attachment, rejection without PDF and PDF-failure fallback passed.`,
  );
} finally {
  await rm(dir, { recursive: true, force: true });
}
