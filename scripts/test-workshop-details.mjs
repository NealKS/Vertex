import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { NEURAL_NETWORK_WORKSHOP as event } from "../src/data/neural-network-workshop.ts";

// Capture locally; this check never sends an email or creates a registration.
const source = readFileSync(new URL("../src/lib/workshop-email.server.ts", import.meta.url), "utf8")
  .replace(
    /^import \{ NEURAL_NETWORK_WORKSHOP as event \}[^\n]+/m,
    `const event = ${JSON.stringify(event)};`,
  )
  .replace(
    /^import nodemailer[^\n]+/m,
    'const nodemailer = { createTransport() { throw new Error("Unexpected SMTP send"); } };',
  )
  .replace(
    /^import QRCode[^\n]+/m,
    'const QRCode = { toBuffer: async () => Buffer.from("test-qr") };',
  );
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { sendWorkshopRegistrationEmail, sendWorkshopPassEmail } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
const oldFetch = globalThis.fetch;
const oldKey = process.env.RESEND_API_KEY,
  oldFrom = process.env.EVENTS_FROM_EMAIL;
const messages = [];
try {
  process.env.RESEND_API_KEY = "local-test-only";
  process.env.EVENTS_FROM_EMAIL = "test@example.invalid";
  globalThis.fetch = async (_url, request) => {
    messages.push(JSON.parse(request.body));
    return new Response("{}", { status: 200 });
  };
  assert.equal(
    await sendWorkshopRegistrationEmail({
      name: "Test & User",
      email: "test@example.invalid",
      registrationId: "local-test",
    }),
    true,
  );
  assert.equal(
    await sendWorkshopPassEmail({
      name: "Test & User",
      email: "test@example.invalid",
      passUrl: "https://vertex-club.vercel.app/passes/neural-networks-from-scratch/test",
      code: "test-code",
    }),
    true,
  );
  assert.equal(messages.length, 2);
  for (const message of messages) {
    for (const body of [message.html, message.text]) {
      assert.ok(body.includes(event.date));
      assert.ok(body.includes(event.time));
      assert.ok(body.includes(event.venue));
      assert.ok(!body.includes("28 October") && !body.includes("B009"));
    }
    assert.ok(message.html.includes("Test &amp; User"));
  }
  const calendar = new URL(
    messages[0].text.match(/https:\/\/calendar\.google\.com\/calendar\/render\?\S+/)[0],
  );
  assert.equal(calendar.searchParams.get("dates"), "20261106T030000Z/20261106T070000Z");
  assert.equal(calendar.searchParams.get("location"), event.venue);
  assert.ok(messages[1].html.includes("cid:vertex-entry-pass"));
  assert.equal(messages[1].attachments[0].content_id, "vertex-entry-pass");
  console.log(
    "PASS: receipt and approval HTML/text use 6 November/CNR Rao, calendar uses the correct IST-to-UTC times, name escaping and QR attachment remain intact. No email sent.",
  );
} finally {
  globalThis.fetch = oldFetch;
  if (oldKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = oldKey;
  if (oldFrom === undefined) delete process.env.EVENTS_FROM_EMAIL;
  else process.env.EVENTS_FROM_EMAIL = oldFrom;
}
