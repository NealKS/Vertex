import assert from "node:assert/strict";
import { persistWorkspaceRegistration, listWorkspaceRegistrations } from "../src/lib/hackathon-registration.server.ts";

const input = { registrationType: "team", participantName: "Lead", email: "LEAD@example.test", phone: "", collegeOrUsn: "CSE001", teamName: "A team with spaces", teamSize: 2, teamMembers: [{ name: "Member", email: "member@example.test" }], track: "OPEN INNOVATION" };
function database(rows = [], options = {}) {
  return { rows, from(table) {
    let insert;
    return {
      select() { return this; }, eq() { return this; },
      async maybeSingle() {
        if (table === "events") return { data: options.noEvent ? null : { id: "event-1" }, error: options.readError ? { message: "unavailable" } : null };
        return { data: { registration_open: !options.closed, min_team_size: 1, max_team_size: 4 }, error: null };
      },
      insert(value) { insert = value; return this; },
      async single() {
        if (options.writeError) return { data: null, error: { code: "XX001" } };
        if (rows.some((row) => row.event_id === insert.event_id && row.email === insert.email)) return { data: null, error: { code: "23505" } };
        const row = { ...structuredClone(insert), id: "registration-1", created_at: "2026-10-27T00:00:00Z" };
        rows.push(row);
        return { data: row, error: null };
      },
      async order() { return { data: structuredClone(rows), error: options.readError ? { message: "unavailable" } : null }; },
    };
  } };
}
const db = database();
const saved = await persistWorkspaceRegistration(db, input);
assert.equal(saved.email, "lead@example.test");
assert.equal(saved.teamName, input.teamName);
assert.deepEqual(saved.teamMembers, input.teamMembers);
assert.equal(saved.id, "registration-1");
assert.deepEqual(await listWorkspaceRegistrations(database(db.rows)), [saved]);
await assert.rejects(() => persistWorkspaceRegistration(database(db.rows), input), /already registered/);
await assert.rejects(() => persistWorkspaceRegistration(database([], { writeError: true }), input), /could not be saved/);
await assert.rejects(() => persistWorkspaceRegistration(database([], { noEvent: true }), input), /unavailable/);
await assert.rejects(() => persistWorkspaceRegistration(database([], { closed: true }), input), /closed/);
await assert.rejects(() => listWorkspaceRegistrations(database([], { readError: true })), /unavailable|could not be loaded/);
await assert.rejects(() => persistWorkspaceRegistration(database(), { ...input, teamMembers: [] }), /at least one teammate/);
await assert.rejects(() => persistWorkspaceRegistration(database(), { ...input, teamMembers: [{ name: "Duplicate", email: input.email }] }), /different email/);
console.log("Registration tests passed: durable reload, complete team data, duplicate enforcement, storage errors, closed event, and invalid team rejection.");
