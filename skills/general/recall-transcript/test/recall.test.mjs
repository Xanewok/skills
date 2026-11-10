// End-to-end tests for recall.mjs, driven through the real CLI against synthetic transcript
// fixtures in a sandboxed $HOME (os.homedir() honors $HOME on POSIX, so ~/.claude/projects
// resolves under the temp dir — the real transcripts are never touched).
//
// Run:  node --test test/recall.test.mjs      (from the skill root)

import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BIN = join(HERE, "..", "bin", "recall.mjs");

// A fixed slug/session so `map <SESSION>` resolves deterministically.
const SLUG = "-fixture-project";
const SESSION = "aaaaaaaa-1111-2222-3333-444444444444";

let HOME; // temp sandbox home

// --- fixture record builders (mirror the real Claude Code JSONL shape) ---
let seq = 0;
const stamp = () => `2026-07-21T10:${String(seq).padStart(2, "0")}:00.000Z`;
const uuidOf = (i) => `uuid${String(i).padStart(4, "0")}-0000-0000-0000-000000000000`;

function rec(type, content, extra = {}) {
  seq += 1;
  return JSON.stringify({
    type,
    uuid: uuidOf(seq),
    timestamp: stamp(),
    message: { role: type, content },
    ...extra,
  });
}
const userText = (t) => rec("user", t);
const asstText = (t) => rec("assistant", [{ type: "text", text: t }]);
const toolUse = (id, name, input) => rec("assistant", [{ type: "tool_use", id, name, input }]);
const toolResult = (id, isError, text) =>
  rec("user", [{ type: "tool_result", tool_use_id: id, is_error: isError, content: text }]);
const compactSummary = () =>
  rec(
    "user",
    "This session is being continued from a previous conversation that ran out of context.",
    { isCompactSummary: true },
  );

// The fixture transcript. Turn numbers (tN) count only records that produce an EVENT — tool-result
// records fold into their issuing turn's anchor (never their own turn), so 10 records → 7 turns.
//
//  t1  user text                          (text-only → NOT a result anchor)
//  t2  assistant Bash "echo hi"           (issuing turn for tu_ok)
//      user tool_result tu_ok  ok         → folds into t2 → result anchor (✓)
//  t3  assistant Bash "false"             (issuing turn for tu_err)
//      user tool_result tu_err error      → folds into t3 → result anchor AND errored (✗)
//  t4  assistant TWO tool_use (mix)       (mixed issuing turn)
//      user TWO tool_results (ok + error) → fold into t4 → result anchor AND errored (✗ precedence)
//  t5  assistant Bash (never answered)    (issued, NO result → NOT a result anchor)
//  t6  assistant text                     (text-only)
//  t7  assistant Write file               (issuing turn; no result → not an anchor, but a written file)
const LINES = [
  userText("start the work"),
  toolUse("tu_ok", "Bash", { command: "echo hi" }),
  toolResult("tu_ok", false, "hi"),
  toolUse("tu_err", "Bash", { command: "false" }),
  toolResult("tu_err", true, "exit status 1"),
  rec("assistant", [
    { type: "tool_use", id: "tu_mok", name: "Bash", input: { command: "echo a" } },
    { type: "tool_use", id: "tu_merr", name: "Bash", input: { command: "boom" } },
  ]),
  rec("user", [
    { type: "tool_result", tool_use_id: "tu_mok", is_error: false, content: "a" },
    { type: "tool_result", tool_use_id: "tu_merr", is_error: true, content: "err" },
  ]),
  toolUse("tu_none", "Bash", { command: "sleep 999 # never answered" }),
  asstText("thinking out loud"),
  toolUse("tu_w", "Write", { file_path: "/repo/out.txt" }),
];

function runMapJson(sessionPrefix, extraArgs = []) {
  const out = execFileSync(
    process.execPath,
    [BIN, "map", sessionPrefix, "--json", ...extraArgs],
    { env: { ...process.env, HOME }, encoding: "utf8" },
  );
  return JSON.parse(out);
}
function runMapText(sessionPrefix, extraArgs = []) {
  return execFileSync(
    process.execPath,
    [BIN, "map", sessionPrefix, ...extraArgs],
    { env: { ...process.env, HOME }, encoding: "utf8" },
  );
}
function runFind(args) {
  return execFileSync(process.execPath, [BIN, "find", ...args], { env: { ...process.env, HOME }, encoding: "utf8" });
}
function runSanitize(mapObj, digestObj) {
  const mapPath = join(HOME, "map.json");
  const digestPath = join(HOME, "digest.json");
  writeFileSync(mapPath, JSON.stringify(mapObj));
  writeFileSync(digestPath, JSON.stringify(digestObj));
  return execFileSync(process.execPath, [BIN, "sanitize", mapPath, digestPath], {
    env: { ...process.env, HOME },
    encoding: "utf8",
  });
}

before(() => {
  HOME = mkdtempSync(join(tmpdir(), "recall-test-"));
  const dir = join(HOME, ".claude", "projects", SLUG);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${SESSION}.jsonl`), LINES.join("\n") + "\n");
  // A second fixture: same content but prefixed with a compaction boundary, for --since-compact.
  const withBoundary = [
    userText("old pre-compaction chatter"),
    toolUse("tu_pre", "Bash", { command: "echo old" }),
    toolResult("tu_pre", false, "old"),
    compactSummary(),
    ...LINES,
  ];
  writeFileSync(join(dir, `bbbbbbbb-0000.jsonl`), withBoundary.join("\n") + "\n");
  // A third fixture: a secret in a command, to assert redaction.
  const withSecret = [
    toolUse("tu_sec", "Bash", { command: "curl -H 'auth: ghp_ABCDEFGHIJKLMNOP0123456789' https://x" }),
    toolResult("tu_sec", false, "ok"),
  ];
  writeFileSync(join(dir, `cccccccc-0000.jsonl`), withSecret.join("\n") + "\n");
  // A fourth fixture: non-Bash tools (AskUserQuestion + an MCP call) that would otherwise render as
  // a bare name — plus a secret inside an MCP arg to prove the gist is redacted.
  const withGist = [
    rec("assistant", [{
      type: "tool_use", id: "tu_ask", name: "AskUserQuestion",
      input: { questions: [{ question: "Which project target?", header: "Target",
        options: [{ label: "Check login" }, { label: "Create fresh" }, { label: "Re-adopt named" }] }] },
    }]),
    toolResult("tu_ask", false, "Check login"),
    toolUse("tu_mcp", "mcp__design__get_project", {
      projectId: "bad70799", url: "https://design.example/p?token=ghp_ABCDEFGHIJKLMNOP0123456789",
    }),
    toolResult("tu_mcp", true, "404 not found"),
  ];
  writeFileSync(join(dir, `dddddddd-0000.jsonl`), withGist.join("\n") + "\n");
  // Polish text — a Unicode lexical query must not canon() to empty and over-match everything.
  writeFileSync(join(dir, `eeeeeeee-0000.jsonl`), userText("zażółć gęślą jaźń notatka") + "\n");
  // Legacy compaction boundary: a continuation-text record carrying NO isCompactSummary field.
  const legacy = [
    userText("pre-compaction chatter"),
    rec("user", "This session is being continued from a previous conversation that ran out of context."),
    ...LINES,
  ];
  writeFileSync(join(dir, `ffffffff-0000.jsonl`), legacy.join("\n") + "\n");
  // A tool body > TOOLBODY with the needle in the MIDDLE (outside the retained tail).
  const bigBody = "X".repeat(300) + " NEEDLE " + "Y".repeat(50);
  writeFileSync(join(dir, `9b9b9b9b-0000.jsonl`),
    [toolUse("tu_big", "Bash", { command: "cat big" }), toolResult("tu_big", false, bigBody)].join("\n") + "\n");
  // A secret inside ASSISTANT TEXT (not a command) — must still be redacted in the map.
  writeFileSync(join(dir, `77777777-0000.jsonl`),
    asstText("token is ghp_ABCDEFGHIJKLMNOP0123456789 do not leak") + "\n");
  // Two sessions sharing a prefix — an ambiguous lookup must fail, not silently pick one.
  writeFileSync(join(dir, `dupdupdu-0001.jsonl`), userText("dup one") + "\n");
  writeFileSync(join(dir, `dupdupdu-0002.jsonl`), userText("dup two") + "\n");
  // A needle past byte 200 of a long tool_use input — find/show must see the full input.
  writeFileSync(join(dir, `abcabcab-0000.jsonl`),
    toolUse("tu_bigcmd", "Bash", { command: "echo " + "x".repeat(230) + " DEEPNEEDLE" }) + "\n");
  // A secret in a user prompt that is itself the match — find output must redact excerpt + 1st prompt.
  writeFileSync(join(dir, `bcbcbcbc-0000.jsonl`),
    userText("my secret is ghp_ABCDEFGHIJKLMNOP0123456789 in the notes") + "\n");
  // A field boundary followed LATER by a legacy continuation — the detector must return the last one.
  const fieldThenLegacy = [
    userText("early chatter"),
    compactSummary(),
    userText("middle work"),
    rec("user", "This session is being continued from a previous conversation that ran out of context."),
    ...LINES,
  ];
  writeFileSync(join(dir, `cdcdcdcd-0000.jsonl`), fieldThenLegacy.join("\n") + "\n");
  // Secrets in a JSON tool_use input: JSON `key: "value"` shape + a shpat_ token prefix.
  writeFileSync(join(dir, `5ec5ec00-0000.jsonl`),
    toolUse("tu_jsonsec", "Bash", { command: "deploy", apiKey: "syntheticsecretvalue123456789", token: "shpat_ABCDEFGHIJKLMNOP0123456789" }) + "\n");
  // A secret in the record's gitBranch metadata — find's branch= line must redact it.
  writeFileSync(join(dir, `6b6a6c00-0000.jsonl`),
    rec("user", "branch secret test here", { gitBranch: "feat/ghp_ABCDEFGHIJKLMNOP0123456789" }) + "\n");
  // A non-ASCII tool result: 150 'ą' chars = 300 bytes (>200), so byte-based stripping must fire.
  writeFileSync(join(dir, `7b7a7c00-0000.jsonl`),
    [toolUse("tu_uni", "Bash", { command: "cat unicode" }), toolResult("tu_uni", false, "ą".repeat(150))].join("\n") + "\n");
  // Authorization headers in a JSON tool input: the `Basic <base64>` and bare-JSON forms must scrub.
  writeFileSync(join(dir, `7a7a7a7a-0000.jsonl`),
    toolUse("tu_auth", "Bash", { command: "curl", headers: { Authorization: "Basic dXNlcjpwYXNzd29yZDEyMw==" }, authorization: "abcdef0123456789ABCDEF" }) + "\n");
});

after(() => {
  if (HOME) rmSync(HOME, { recursive: true, force: true });
});

test("result-anchor floor: ok, error, and mixed turns all anchor; text-only and no-result do not", () => {
  const m = runMapJson(SESSION);
  const ra = new Set(m.resultAnchors);
  assert.deepEqual([...ra].sort((a, b) => a - b), [2, 3, 4], "only issuing turns with a correlated result");
  // t2 ok, t3 error-only, t4 mixed → all anchors (error results count as evidence)
  assert.ok(ra.has(3), "an error-only turn is still a result anchor");
  assert.ok(ra.has(4), "a mixed turn is a result anchor");
  // t1 text-only, t5 issued-but-no-result, t6 text, t7 write-no-result → NOT anchors
  for (const n of [1, 5, 6, 7]) assert.ok(!ra.has(n), `t${n} must not be an anchor`);
});

test("errored set: attributed to the issuing turn, captures error-only and mixed", () => {
  const m = runMapJson(SESSION);
  const errored = new Set(m.anchors.filter((a) => a.errored).map((a) => Number(a.id.slice(1))));
  assert.deepEqual([...errored].sort((a, b) => a - b), [3, 4], "t3 (error-only) and t4 (mixed) errored");
  assert.ok(!errored.has(2), "the all-ok turn is not errored");
});

test("map: tool-result records fold into their issuer — no content-free tool turns", () => {
  const m = runMapJson(SESSION);
  assert.ok(m.anchors.every((a) => a.role !== "tool"), "no tool-role anchors survive");
  assert.equal(m.window.turns, 7, "10 records → 7 event turns (3 tool_result records fold)");
});

test("per-anchor hasResult matches the resultAnchors set (single source, no drift)", () => {
  const m = runMapJson(SESSION);
  const ra = new Set(m.resultAnchors);
  for (const a of m.anchors) {
    assert.equal(a.hasResult, ra.has(Number(a.id.slice(1))), `${a.id} hasResult must equal membership`);
  }
});

test("text render: ✗ on the errored issuing turn, ✓ on the ok turn, blank on no-result", () => {
  const txt = runMapText(SESSION);
  const line = (n) => txt.split("\n").find((l) => l.startsWith(`[t${n}·`)) || "";
  assert.match(line(2), /\]\s*✓\s/, "t2 ok → ✓");
  assert.match(line(3), /\]\s*✗\s/, "t3 error → ✗");
  assert.match(line(4), /\]\s*✗\s/, "t4 mixed → ✗ (error precedence)");
  assert.match(line(5), /\]\s{2,}assistant/, "t5 issued-no-result → blank mark");
  assert.match(txt, /RESULT_ANCHORS\s+t2, t3, t4/);
  assert.match(txt, /ERRORS\s+t3, t4/);
  assert.doesNotMatch(txt, /SUCCESS_ANCHORS/, "old label is gone");
});

test("sanitize: quarantines fabricated-anchor claims, renders clean claims full, and points at the source", () => {
  const m = runMapJson(SESSION);
  const out = runSanitize(m, {
    objective: [{ text: "ship the thing", anchors: ["t1"] }],
    done: [
      { text: "a real completed step with a long descriptive claim that must not be truncated mid-word", anchors: ["t2"] },
      { text: "cites a hallucinated turn", anchors: ["t999"] },
    ],
    pending: [{ text: "the important unresolved thread", anchors: ["t5"] }],
    decisions: [], next: [],
    unknown: [{ text: "needs the full body of a stripped turn", anchors: ["t4"] }],
  });
  assert.match(out, /TRACED, NOT VERIFIED/, "the caveat rides in the artifact as a top banner");
  assert.match(out, /a real completed step with a long descriptive claim that must not be truncated mid-word/, "no truncation");
  assert.match(out, /UNKNOWN\s+needs the full body/, "unknown section is rendered, not dropped");
  assert.match(out, /PENDING\s+the important unresolved thread/, "pending survives");
  assert.match(out, /SUSPECT[\s\S]*DONE: cites a hallucinated turn[\s\S]*fabricated t999/, "all-hallucinated claim is quarantined to SUSPECT with the fabricated id named");
  assert.doesNotMatch(out, /DONE\s+cites a hallucinated turn/, "and never renders under its original DONE status");
  assert.match(out, /dropped 1 fabricated anchor/, "the fabricated anchor is reported in the summary");
  assert.match(out, /ANCHORS\s+t1=\S{8}\b/, "cited anchors resolve to a uuid8 legend so grep-by-id is executable");
  assert.match(out, /SOURCE/, "the transcript source path is surfaced");
  assert.match(out, /TO VERIFY/, "and guidance on how to verify claims");
  assert.doesNotMatch(out, /evidenced|⚠reported/, "no pseudo-calibration labels");
});

test("sanitize: FAIL-CLOSED — a claim mixing a real and a fabricated anchor is quarantined, not lifeboated", () => {
  // The incident: a false "task closed" cited one real anchor (t2) + one hallucinated (t999). The old
  // fail-open render dropped t999 and showed the claim under DONE citing t2. Fail-closed quarantines it.
  const m = runMapJson(SESSION);
  const out = runSanitize(m, {
    objective: [], done: [{ text: "task T-9999 closed", anchors: ["t2", "t999"] }],
    pending: [], decisions: [], next: [], unknown: [],
  });
  assert.match(out, /SUSPECT[\s\S]*task T-9999 closed[\s\S]*cites t2 · fabricated t999/, "mixed claim is quarantined, showing both the surviving and fabricated anchors");
  assert.doesNotMatch(out, /DONE\s+task T-9999 closed/, "the surviving real anchor is NOT a lifeboat — the claim never renders as cited");
  assert.doesNotMatch(out, /ANCHORS\s+t2=/, "and t2 is not promoted to the cited-legend off a quarantined claim");
});

test("find --regex: a ^-anchored pattern matches content, not defeated by the raw-JSON prefilter", () => {
  const out = runFind(["^start the work", "--regex", "--all-projects"]);
  assert.match(out, /aaaaaaaa-1111/, "the anchored pattern finds the session whose content starts with it");
});

test("find --regex: an invalid pattern exits cleanly with a message, no stack dump", () => {
  assert.throws(
    () => runFind(["foo(bar", "--regex", "--all-projects"]),
    (e) => {
      assert.match(String(e.stderr), /Invalid regex/);
      assert.doesNotMatch(String(e.stderr), /at makeMatcher/);
      return true;
    },
  );
});

test("find: a Unicode query matches only where it occurs (no empty-canon over-match)", () => {
  const out = runFind(["żółć", "--all-projects"]);
  assert.match(out, /eeeeeeee/, "the Polish session matches");
  assert.match(out, /^1 session\(s\) match/m, "exactly one session — not an over-match of every record");
});

test("find: matches a needle deep in a long tool_use input (no early truncation)", () => {
  const out = runFind(["DEEPNEEDLE", "--all-projects"]);
  assert.match(out, /abcabcab/, "a needle past byte 200 of a command is still found");
});

test("find: redacts secrets in the excerpt and the 1st-user-prompt line", () => {
  const out = runFind(["my secret is", "--all-projects"]);
  assert.match(out, /bcbcbcbc/, "the session matches");
  assert.doesNotMatch(out, /ghp_ABCDEFGHIJKLMNOP/, "a token in find output must be redacted");
  assert.match(out, /⟦redacted/, "redaction marker present");
});

test("find: a query with no letters or numbers is rejected, not treated as match-everything", () => {
  assert.throws(
    () => runFind(["!!!", "--all-projects"]),
    (e) => {
      assert.match(String(e.stderr), /no letters or numbers/);
      return true;
    },
  );
});

test("redaction: JSON `key: \"value\"` secrets and a shpat_ token in a tool input are scrubbed in show", () => {
  const out = execFileSync(process.execPath, [BIN, "show", "5ec5ec00"], { env: { ...process.env, HOME }, encoding: "utf8" });
  assert.doesNotMatch(out, /syntheticsecretvalue123456789/, "JSON key: value secret redacted");
  assert.doesNotMatch(out, /shpat_ABCDEFGHIJKLMNOP/, "shpat_ token redacted");
  assert.match(out, /⟦redacted/, "redaction markers present");
});

test("redaction: Authorization Basic and bare-JSON auth values are scrubbed in show", () => {
  const out = execFileSync(process.execPath, [BIN, "show", "7a7a7a7a"], { env: { ...process.env, HOME }, encoding: "utf8" });
  assert.doesNotMatch(out, /dXNlcjpwYXNzd29yZDEyMw/, "Basic base64 credential redacted");
  assert.doesNotMatch(out, /abcdef0123456789ABCDEF/, "bare-JSON authorization value redacted");
  assert.match(out, /⟦redacted/, "redaction markers present");
});

test("find: a secret in gitBranch metadata is redacted in the branch= line", () => {
  const out = runFind(["branch secret test", "--all-projects"]);
  assert.match(out, /6b6a6c00/, "the session matches");
  assert.doesNotMatch(out, /ghp_ABCDEFGHIJKLMNOP/, "token in branch metadata must be redacted");
});

test("show: the tool-body marker reports true UTF-8 bytes (non-ASCII body strips by byte size)", () => {
  const out = execFileSync(process.execPath, [BIN, "show", "7b7a7c00"], { env: { ...process.env, HOME }, encoding: "utf8" });
  assert.match(out, /⟦tool_result 300b/, "150 'ą' chars = 300 bytes: stripped, and the marker is honest");
});

test("map --since-compact: the LAST boundary wins when a field marker precedes a later legacy one", () => {
  const m = runMapJson("cdcdcdcd", ["--since-compact"]);
  assert.equal(m.boundary.method, "legacy", "the later legacy continuation wins over the earlier field marker");
  assert.equal(m.window.turns, 7, "the window starts after the last boundary, not the first");
});

test("map --since-compact: a legacy continuation boundary excludes the marker and records BASELINE", () => {
  const m = runMapJson("ffffffff", ["--since-compact"]);
  assert.equal(m.boundary.method, "legacy", "legacy continuation-text boundary detected");
  assert.ok(m.baseline, "BASELINE captured from the legacy marker (not left null)");
  assert.equal(m.window.turns, 7, "post-boundary event turns only — the marker is not t1");
});

test("show --grep: marks a phrase buried inside a stripped tool body (matched before truncation)", () => {
  const out = execFileSync(process.execPath, [BIN, "show", "9b9b9b9b", "--grep", "NEEDLE"],
    { env: { ...process.env, HOME }, encoding: "utf8" });
  assert.match(out, /◀── MATCH/, "the buried needle is marked even though the body is stripped from the dump");
});

test("map: a secret in assistant TEXT is redacted, not just in commands", () => {
  const txt = runMapText("77777777");
  assert.doesNotMatch(txt, /ghp_ABCDEFGHIJKLMNOP/, "a token in prose must be redacted");
  assert.match(txt, /⟦redacted/, "redaction marker present");
});

test("resolveSession: an ambiguous prefix fails loudly instead of silently selecting one", () => {
  assert.throws(
    () => execFileSync(process.execPath, [BIN, "map", "dupdupdu"], { env: { ...process.env, HOME }, encoding: "utf8" }),
    (e) => {
      assert.match(String(e.stderr), /Ambiguous/);
      return true;
    },
  );
});

test("--since-compact starts after the boundary and records BASELINE", () => {
  const full = runMapJson("bbbbbbbb");
  const sinceJson = runMapJson("bbbbbbbb", ["--since-compact"]);
  assert.equal(sinceJson.boundary.method, "field", "field-based boundary detection");
  assert.ok(full.window.turns > sinceJson.window.turns, "since-compact yields fewer turns");
  assert.equal(sinceJson.window.turns, 7, "exactly the post-boundary event turns (LINES folds to 7)");
  assert.ok(sinceJson.baseline, "BASELINE captured from the compact summary");
});

test("boundary detection is field-based, not substring: a session merely DISCUSSING compaction has none", () => {
  // SESSION contains no isCompactSummary record; talking about it must not trip detection.
  const sinceJson = runMapJson(SESSION, ["--since-compact"]);
  assert.equal(sinceJson.boundary.method, "none", "no false-positive boundary");
});

test("gist: AskUserQuestion surfaces its prompt + option labels instead of a bare name", () => {
  const txt = runMapText("dddddddd");
  const line = txt.split("\n").find((l) => /AskUserQuestion/.test(l)) || "";
  assert.match(line, /Which project target\?/, "the decision prompt is surfaced");
  for (const opt of ["Check login", "Create fresh", "Re-adopt named"])
    assert.ok(line.includes(opt), `option "${opt}" must appear (was the biggest real-world miss)`);
});

test("gist: an MCP tool call surfaces its args, and secrets in them are redacted", () => {
  const txt = runMapText("dddddddd");
  const line = txt.split("\n").find((l) => /mcp__design__get_project/.test(l)) || "";
  assert.match(line, /projectId=bad70799/, "MCP arg surfaced, not a bare tool name");
  assert.doesNotMatch(line, /ghp_ABCDEFGHIJKLMNOP/, "secret in an MCP arg must be redacted");
  assert.match(line, /⟦redacted/, "redaction marker present in the gist");
});

test("redaction: a secret in a command never reaches the map output", () => {
  const txt = runMapText("cccccccc");
  assert.doesNotMatch(txt, /ghp_ABCDEFGHIJKLMNOP/, "raw token must be redacted");
  assert.match(txt, /⟦redacted/, "redaction marker present");
});
