#!/usr/bin/env node
// Read-only recall over Claude Code transcripts. Four subcommands: find, show, map, sanitize.
// Contract: parse JSONL by ROLE (never raw-grep — JSON escaping + giant lines + role ambiguity
// make raw grep both over- and under-match, and it cannot tell "user typed X" from "assistant said X").
// Deterministic, dependency-free, never writes. Ranking = most hits then most-recent, explained not blended.

import { createReadStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { homedir } from 'node:os';
import { join, basename } from 'node:path';

const PROJECTS = join(homedir(), '.claude', 'projects');
const EXCERPT = 160; // rendered excerpt cap per hit
const TOOLBODY = 200; // strip tool bodies longer than this to metadata

// cwd -> project slug: Claude replaces every '/' in the abs path with '-'.
const slugFor = (dir) => dir.replace(/\//g, '-');

function parseArgs(argv) {
  const out = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out.flags[key] = true;
      else { out.flags[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

// Normalize one transcript record -> { role, text } or null (non-content records).
// role ∈ user | assistant | tool. Claude stores tool results as user-role messages carrying
// tool_result blocks, so those are re-tagged 'tool'.
function extract(rec) {
  const type = rec.type;
  if (type !== 'user' && type !== 'assistant') return null;
  const msg = rec.message;
  if (!msg) return null;
  const content = msg.content;
  let role = type;
  const parts = [];
  if (typeof content === 'string') {
    parts.push(content);
  } else if (Array.isArray(content)) {
    for (const b of content) {
      if (!b || typeof b !== 'object') continue;
      if (b.type === 'text' && typeof b.text === 'string') parts.push(b.text);
      else if (b.type === 'tool_use') {
        // Keep the full input: find/show match on this text, and a needle can sit deep in a long
        // command. Rendered output is bounded downstream (find excerpts, show --max-chars).
        parts.push(`⟦tool_use ${b.name}⟧ ${JSON.stringify(b.input ?? {})}`);
      } else if (b.type === 'tool_result') {
        role = 'tool';
        let t = b.content;
        if (Array.isArray(t)) t = t.map((x) => (x && x.type === 'text' ? x.text : '')).join('\n');
        if (typeof t !== 'string') t = JSON.stringify(t ?? '');
        parts.push(t);
      }
    }
  }
  return { role, text: parts.join('\n') };
}

const norm = (s) => s.toLowerCase();
// Collapse to letter/number tokens (Unicode-aware: \p{L}\p{N}, so Polish/CJK queries don't degrade to
// empty and over-match everything) so a phrase matches through markdown/punctuation/whitespace
// ("Currency caveat: !318" ≡ "**Currency caveat:** !318").
const canon = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const longestToken = (s) => (s.toLowerCase().match(/[\p{L}\p{N}]+/gu) || ['']).reduce((a, b) => (b.length > a.length ? b : a), '');

function makeMatcher(query, { regex }) {
  if (regex) {
    let re;
    try {
      re = new RegExp(query, 'i');
    } catch (e) {
      console.error(`Invalid regex: ${e.message}`);
      process.exit(2);
    }
    // No raw prefilter in regex mode: a ^/$-anchored pattern tests against JSON structure, not
    // content, and would silently drop real matches. Parse every line — correctness over speed.
    return { test: (s) => re.test(s), raw: () => true, re };
  }
  const cq = canon(query);
  const anchor = longestToken(query); // cheap necessary condition for the raw prefilter
  return { test: (s) => canon(s).includes(cq), raw: (line) => (anchor ? norm(line).includes(anchor) : true) };
}

async function listTranscripts(flags) {
  const dirs = [];
  if (flags['all-projects']) {
    for (const d of await readdir(PROJECTS)) dirs.push(join(PROJECTS, d));
  } else {
    dirs.push(join(PROJECTS, slugFor(process.cwd())));
  }
  const files = [];
  for (const dir of dirs) {
    let entries;
    try { entries = await readdir(dir); } catch { continue; }
    for (const e of entries) if (e.endsWith('.jsonl')) files.push(join(dir, e));
  }
  return files;
}

// Resolve a session prefix to exactly one transcript. An ambiguous prefix must fail loudly, not
// silently recall the wrong session. Returns the path, or null (with exitCode set) on miss/ambiguity.
async function resolveSession(prefix) {
  const m = (await listTranscripts({ 'all-projects': true })).filter((f) => basename(f).startsWith(prefix));
  if (m.length === 0) {
    console.error(`No transcript found for session prefix "${prefix}".`);
    process.exitCode = 1;
    return null;
  }
  if (m.length > 1) {
    console.error(`Ambiguous prefix "${prefix}" — ${m.length} matches:\n${m.map((f) => '  ' + basename(f)).join('\n')}`);
    process.exitCode = 1;
    return null;
  }
  return m[0];
}

function excerpt(text, matcher, query, regex) {
  text = redact(text); // redact before locating/slicing, so no secret (or a split fragment) reaches find output
  let idx = regex ? text.search(matcher.re) : norm(text).indexOf(norm(query));
  if (idx < 0) idx = norm(text).indexOf(longestToken(query)); // canon matched but literal didn't (markdown/ws)
  if (idx < 0) idx = 0;
  const start = Math.max(0, idx - 40);
  let s = text.slice(start, start + EXCERPT).replace(/\s+/g, ' ').trim();
  if (start > 0) s = '…' + s;
  return s;
}

async function cmdFind(query, flags) {
  const roleFilter = flags.role; // user | assistant | tool | undefined
  const regex = !!flags.regex;
  // A non-regex query with no letters/numbers canon()s to '' and would match every record. Reject it.
  if (!regex && canon(query) === '') {
    console.error(`Query "${query}" has no letters or numbers to match on — use --regex for symbol/punctuation search.`);
    process.exitCode = 2;
    return;
  }
  const matcher = makeMatcher(query, { regex });
  const files = await listTranscripts(flags);
  if (files.length === 0) { console.error('No transcript dir for cwd. Try --all-projects.'); process.exitCode = 1; return; }

  // session -> aggregate
  const sessions = new Map();
  for (const file of files) {
    const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
    let lineNo = 0;
    let sessionId = basename(file).replace(/\.jsonl$/, '');
    let cwd = null, branch = null;
    for await (const line of rl) {
      lineNo++;
      if (!line) continue;
      // fast prefilter on the raw line; only JSON.parse candidates
      if (!matcher.raw(line)) {
        // still cheaply capture firstUserPrompt/cwd without full parse? need parse; skip for speed
        continue;
      }
      let rec;
      try { rec = JSON.parse(line); } catch { continue; }
      if (rec.sessionId) sessionId = rec.sessionId;
      if (rec.cwd) cwd = rec.cwd;
      if (rec.gitBranch) branch = rec.gitBranch;
      const ex = extract(rec);
      if (!ex || !ex.text) continue;
      if (roleFilter && ex.role !== roleFilter) continue;
      if (!matcher.test(ex.text)) continue; // confirm match is in real content, not JSON metadata
      const ts = rec.timestamp || '';
      let agg = sessions.get(sessionId);
      if (!agg) { agg = { sessionId, file, hits: [], cwd, branch, roles: new Set() }; sessions.set(sessionId, agg); }
      agg.roles.add(ex.role);
      agg.hits.push({ ts, role: ex.role, line: lineNo, excerpt: excerpt(ex.text, matcher, query, regex) });
      if (cwd) agg.cwd = cwd;
      if (branch) agg.branch = branch;
    }
  }

  if (sessions.size === 0) { console.log('No content matches (parsed by role). Note: zero hits ≠ absent — try --regex, drop --role, or --all-projects.'); return; }

  // enrich each session with its first user prompt (one more cheap pass, matched files only)
  for (const agg of sessions.values()) {
    const rl = createInterface({ input: createReadStream(agg.file), crlfDelay: Infinity });
    for await (const line of rl) {
      if (agg.firstUserPrompt) break;
      if (!line || !line.includes('"user"')) continue;
      let rec; try { rec = JSON.parse(line); } catch { continue; }
      if (rec.type !== 'user') continue;
      const ex = extract(rec);
      if (!ex || ex.role !== 'user') continue;
      const t = ex.text.trim();
      // skip harness-injected wrappers (slash-command stdout, caveats) — not a real prompt
      if (!t || /^<(local-command|command-)/.test(t) || t.startsWith('Caveat:')) continue;
      agg.firstUserPrompt = redact(t.replace(/\s+/g, ' ')).slice(0, 80); break;
    }
  }

  const rows = [...sessions.values()].map((agg) => {
    agg.hits.sort((a, b) => (a.ts < b.ts ? -1 : 1));
    return { agg, first: agg.hits[0].ts, last: agg.hits[agg.hits.length - 1].ts };
  });
  // global earliest occurrence -> label the origin vs later copies
  const globalFirst = rows.reduce((m, r) => (r.first < m ? r.first : m), rows[0].first);
  // rank: most hits first (relevance), then most-recent — never recency alone (concurrent sessions
  // make "newest" a poor guess; disambiguate with --role). Lexicographic + explained, not blended.
  rows.sort((a, b) => (b.agg.hits.length - a.agg.hits.length) || (a.last < b.last ? 1 : -1));

  console.log(`\n${rows.length} session(s) match "${redact(query)}"${roleFilter ? ` [role=${roleFilter}]` : ''}${regex ? ' [regex]' : ''} — ranked:\n`);
  for (const r of rows) {
    const a = r.agg;
    const origin = r.first === globalFirst ? '  ⟵ earliest occurrence' : '';
    console.log(`● ${a.sessionId}`);
    console.log(`  roles=${[...a.roles].join(',')}  hits=${a.hits.length}  span=${r.first} … ${r.last}${origin}`);
    if (a.branch) console.log(`  branch=${redact(a.branch)}`);
    if (a.firstUserPrompt) console.log(`  1st user prompt: ${a.firstUserPrompt}`);
    const show = a.hits.slice(0, 3);
    for (const h of show) console.log(`  · [${h.role} @ ${h.ts}] «${h.excerpt}»`);
    if (a.hits.length > show.length) console.log(`  · …+${a.hits.length - show.length} more`);
    console.log('');
  }
  console.log(`Next: recall.mjs show <sessionId> [--grep "<phrase>"] [--role <r>] [--since-compact]`);
}

// ─── deterministic evidence layer (boundary / map / sanitize) ───────────────
// Best-effort scrub of OBVIOUS secrets before any content reaches a model or a rendered map. Not a
// guarantee — it catches known token prefixes and secret-named fields (incl. the JSON `key: "value"`
// shape, since tool inputs are serialized JSON), not every possible credential format.
function redact(s) {
  if (typeof s !== 'string') return s;
  return s
    .replace(/\b(?:gh[pousr]_|glpat-|ph[cx]_|sk-|xox[baprs]-|shpat_)[A-Za-z0-9._-]{16,}/g, '⟦redacted-token⟧')
    // secret-named field, `key=value` or JSON `key: "value"`, with or without quotes around either
    .replace(/(["']?\b[A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_?KEY|KEY)["']?\s*[:=]\s*["']?)[^\s"',}]{4,}/gi, '$1⟦redacted⟧')
    // authorization/bearer value, tolerating JSON quotes+colon and a Basic/Bearer/Token scheme word
    // (value class includes base64 +/= so a `Basic dXNlcjpwYXNz` blob is scrubbed whole)
    .replace(/((?:authorization|bearer)\b["'\s:=]*(?:(?:Basic|Bearer|Token|Digest)["'\s]+)?)[A-Za-z0-9+/._=-]{16,}/gi, '$1⟦redacted⟧');
}

// Structured, block-level view of one record (map needs blocks, not flattened text).
function eventsFor(rec) {
  const msg = rec.message;
  if (!msg) return null;
  const content = msg.content;
  let role = rec.type;
  const blocks = [];
  if (typeof content === 'string') { if (content.trim()) blocks.push({ kind: 'text', text: content }); }
  else if (Array.isArray(content)) {
    for (const b of content) {
      if (!b || typeof b !== 'object') continue;
      if (b.type === 'text' && b.text) blocks.push({ kind: 'text', text: b.text });
      else if (b.type === 'tool_use') blocks.push({ kind: 'tool_use', id: b.id, name: b.name, input: b.input || {} });
      else if (b.type === 'tool_result') {
        role = 'tool';
        let t = b.content;
        if (Array.isArray(t)) t = t.map((x) => (x && x.type === 'text' ? x.text : '')).join('\n');
        if (typeof t !== 'string') t = JSON.stringify(t ?? '');
        blocks.push({ kind: 'tool_result', id: b.tool_use_id, is_error: b.is_error === true, text: t });
      }
    }
  }
  return blocks.length ? { role, blocks } : null;
}

// Files/commands from a tool call. write/read targets are exact (structured tool inputs);
// REFERENCED is heuristic (paths parsed out of a shell string) — kept separate, never blended.
function toolFacts(name, input) {
  const f = { written: [], read: [], ref: [], command: null, gist: null };
  if (name === 'Write' || name === 'Edit' || name === 'MultiEdit' || name === 'NotebookEdit') { if (input.file_path) f.written.push(input.file_path); }
  else if (name === 'Read') { if (input.file_path) f.read.push(input.file_path); }
  else if (name === 'Bash' && input.command) {
    f.command = redact(String(input.command));
    for (const m of String(input.command).matchAll(/(?:^|\s)((?:\.{0,2}\/|~\/)?[\w./-]+\.[A-Za-z0-9]{1,6})\b/g)) f.ref.push(m[1]);
  }
  else f.gist = toolGist(input); // AskUserQuestion / MCP / Agent etc. — else they render as a bare name
  return f;
}

// A short, deterministic snippet of a tool's input, so a decision point (AskUserQuestion) or an MCP
// call doesn't collapse to just its name in the EVENTS map. Redacted; render-only (not a rollup key).
function toolGist(input) {
  if (!input || typeof input !== 'object') return null;
  if (Array.isArray(input.questions)) { // AskUserQuestion: options first — they're the actionable
    const g = input.questions.map((q) => { // content and must survive the line-length truncation
      const opts = (q?.options || []).map((o) => o?.label).filter(Boolean).join('|');
      const q_ = (q?.question || q?.header || '').replace(/\s+/g, ' ').trim();
      return opts ? `{${opts}} ${q_}` : q_;
    }).join(' ');
    return g ? redact(g).slice(0, 160) : null;
  }
  const parts = []; // generic (incl. MCP): first few short scalar args, in declared order
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === 'string' && v.trim()) parts.push(`${k}=${redact(v.trim().replace(/\s+/g, ' ')).slice(0, 80)}`);
    else if (typeof v === 'number' || typeof v === 'boolean') parts.push(`${k}=${v}`);
    if (parts.length >= 3) break;
  }
  return parts.length ? redact(parts.join(' ')).slice(0, 140) : null;
}

// Robust compaction-boundary detector: parse JSON and test the isCompactSummary FIELD (never
// substring-match raw lines — that false-positives on any session that merely *discusses* compaction).
// Legacy format = a structural continuation-record. Returns the LAST boundary of EITHER format —
// whichever appears latest wins, since --since-compact wants the most recent compaction.
// { line, method: 'field'|'legacy'|'none' }.
async function detectCompactBoundary(file) {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  let n = 0, line = 0, method = 'none';
  for await (const raw of rl) {
    n++;
    if (!raw.includes('isCompactSummary') && !raw.includes('is being continued')) continue;
    let rec; try { rec = JSON.parse(raw); } catch { continue; }
    if (rec.isCompactSummary === true) { line = n; method = 'field'; continue; }
    if (rec.type === 'user') {
      const ex = extract(rec);
      if (ex && /^This session is being continued from a previous conversation/.test((ex.text || '').trim())) { line = n; method = 'legacy'; }
    }
  }
  return { line, method };
}

async function cmdShow(sessionPrefix, flags) {
  const file = await resolveSession(sessionPrefix);
  if (!file) return;
  const roleFilter = flags.role;
  const grep = flags.grep && typeof flags.grep === 'string' ? norm(flags.grep) : null;
  const sinceCompact = !!flags['since-compact'];
  const maxChars = Number(flags['max-chars']) || 6000;

  let startLine = 0;
  if (sinceCompact) {
    const b = await detectCompactBoundary(file);
    startLine = b.line;
    if (b.method === 'none') console.error('(no compaction boundary — showing whole session)');
    else console.error(`(since compaction boundary at line ${b.line}, detected by ${b.method})`);
  }

  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  let n = 0, printed = 0;
  console.log(`# ${basename(file)}\n`);
  for await (const line of rl) {
    n++;
    if (n <= startLine) continue;
    if (!line) continue;
    let rec; try { rec = JSON.parse(line); } catch { continue; }
    const ex = extract(rec);
    if (!ex || !ex.text.trim()) continue;
    if (roleFilter && ex.role !== roleFilter) continue;
    // Redact the whole turn up front (show output is model-pipeable per SKILL), so no secret — or a
    // fragment split by a later truncation — can slip through. Keep the original length for the marker.
    const original = ex.text;
    const bytes = Buffer.byteLength(original, 'utf8'); // true byte size, so the "…b" marker is honest for non-ASCII
    let text = redact(original);
    // Match on the full text before stripping — else --grep misses phrases inside a fat tool body.
    const hit = grep && norm(text).includes(grep) ? '  ◀── MATCH' : '';
    // strip fat tool bodies to a marker so the dump stays readable / cheap-model friendly
    if (ex.role === 'tool' && bytes > TOOLBODY) {
      const tail = text.slice(-120).replace(/\s+/g, ' ');
      text = `⟦tool_result ${bytes}b — tail: …${tail}⟧`;
    }
    console.log(`[${ex.role} @ ${rec.timestamp || '?'}]${hit}`);
    const shown = text.length > maxChars ? text.slice(0, maxChars) + `…[+${Buffer.byteLength(text.slice(maxChars))}b]` : text;
    console.log(shown);
    console.log('');
    printed++;
  }
  console.error(`\n(${printed} turns)`);
}

const uuid8 = (u) => (u || '????????').replace(/-/g, '').slice(0, 8);
const hhmm = (ts) => (ts && ts.length >= 16 ? ts.slice(11, 16) : '??:??');

// Deterministic evidence map. Emits per-turn anchors + rollups + a result-anchor set
// (turns whose issued tool got a correlated result, error or not) that `sanitize` uses as
// the evidence-provenance floor for "evidenced" claims.
// The model NEVER produces these facts; it only cites the anchors this map stamps.
async function cmdMap(sessionPrefix, flags) {
  const file = await resolveSession(sessionPrefix);
  if (!file) return;
  const sinceCompact = !!flags['since-compact'];
  const asJson = !!flags.json;
  const boundary = sinceCompact ? await detectCompactBoundary(file) : { line: 0, method: 'none' };

  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  let n = 0, malformed = 0;
  let baseline = null;
  const turns = [];
  const resultSeen = new Set(); // tool_use_id that got any correlated tool_result
  const resultErr = new Set();  // tool_use_id whose result was is_error
  for await (const raw of rl) {
    n++;
    if (n < boundary.line || !raw) continue;
    let rec; try { rec = JSON.parse(raw); } catch { if (raw.trim()) malformed++; continue; }
    // The boundary record itself is the BASELINE, not a "since compact" event — for both the field
    // marker and the legacy continuation-text record (which carries no isCompactSummary field).
    if (rec.isCompactSummary === true || (n === boundary.line && boundary.method === 'legacy')) {
      const ex = extract(rec);
      baseline = { uuid: rec.uuid, ts: rec.timestamp, bytes: Buffer.byteLength(ex?.text || '') };
      continue;
    }
    const ev = eventsFor(rec);
    if (!ev) continue;
    // A tool-result record is not its own event: fold its results into the issuing turn's anchor
    // (correlated by id below), never emit a content-free turn. Tool_results only ever appear in
    // these records (no transcript mixes them with text), so the main loop needs no result branch.
    if (ev.role === 'tool') {
      for (const b of ev.blocks) {
        if (b.kind === 'tool_result' && b.id) {
          resultSeen.add(b.id);
          if (b.is_error) resultErr.add(b.id);
        }
      }
      continue;
    }
    const t = { seq: turns.length + 1, uuid: rec.uuid, ts: rec.timestamp, role: ev.role, text: '', tools: [] };
    for (const b of ev.blocks) {
      if (b.kind === 'text') {
        if (!t.text) t.text = redact(b.text.replace(/\s+/g, ' ').trim()).slice(0, 80);
      } else if (b.kind === 'tool_use') {
        const f = toolFacts(b.name, b.input);
        t.tools.push({ id: b.id, name: b.name, ...f });
      }
    }
    turns.push(t);
  }

  // One attribution rule: a turn owns whatever its ISSUED tools got back (results arrive in a later
  // tool-role record; correlate by tool_use_id). resultAnchors marks "produced a tool result", error or
  // not (an error result is itself evidence of a failure claim) — a traceability hint, not a guarantee.
  const resultAnchors = new Set(), errored = new Set();
  for (const t of turns) {
    if (t.tools.some((x) => resultSeen.has(x.id))) resultAnchors.add(t.seq);
    if (t.tools.some((x) => resultErr.has(x.id))) errored.add(t.seq);
  }

  const written = new Set(), read = new Set(), ref = new Set(), commands = [];
  for (const t of turns) for (const x of t.tools) {
    x.written.forEach((p) => written.add(p)); x.read.forEach((p) => read.add(p)); x.ref.forEach((p) => ref.add(p));
    if (x.command) commands.push({ seq: t.seq, cmd: x.command.slice(0, 80) });
  }
  const window = turns.length ? `t1..t${turns.length}  [${hhmm(turns[0].ts)}..${hhmm(turns[turns.length - 1].ts)}]` : '(empty)';

  if (asJson) {
    console.log(JSON.stringify({
      session: basename(file).replace(/\.jsonl$/, ''),
      file, // absolute transcript path, so `sanitize` can point the capable model back at the source
      boundary, window: { turns: turns.length, first: turns[0]?.ts, last: turns[turns.length - 1]?.ts },
      baseline, resultAnchors: [...resultAnchors],
      anchors: turns.map((t) => ({ id: `t${t.seq}`, uuid8: uuid8(t.uuid), ts: t.ts, role: t.role, hasResult: resultAnchors.has(t.seq), errored: errored.has(t.seq) })),
      coverage: { turns: turns.length, malformed },
    }, null, 2));
    return;
  }

  console.log(`# MAP ${basename(file).replace(/\.jsonl$/, '')}`);
  console.log(`BOUNDARY ${boundary.method}${boundary.line ? ` [line ${boundary.line}]` : ' — whole session'}`);
  console.log(`WINDOW   ${window}`);
  console.log(`BASELINE ${baseline ? `compact summary at ${uuid8(baseline.uuid)} (${baseline.bytes}b, pre-boundary) — text excluded here; grep that uuid in SOURCE for the pre-reset objective/constraints` : 'none'}`);
  // Single source for the per-turn hint: ✗ if an issued tool errored, ✓ if it got a result, else blank.
  const mark = (seq) => errored.has(seq) ? '✗' : resultAnchors.has(seq) ? '✓' : ' ';
  console.log(`\nEVENTS  (cite these anchors; ✓ = a tool RESULT was received — NOT proof the intended effect happened · ✗ = error result)`);
  for (const t of turns) {
    const tl = t.tools.map((x) => x.command ? `${x.name}:${x.command.slice(0, 44)}` : x.gist ? `${x.name}:${x.gist}` : x.name).join(' ');
    console.log(`[t${t.seq}·${hhmm(t.ts)}·${uuid8(t.uuid)}] ${mark(t.seq)} ${t.role.padEnd(5)} ${t.text || tl || ''}${t.text && tl ? ' | ' + tl : ''}`.slice(0, 160));
  }
  // WRITE/READ_TARGETS = deterministic tool INPUTS (what a call targeted), not verified effects — a
  // Write with no result still lands here. Per-command outcome lives in EVENTS/ERRORS, not COMMANDS.
  const list = (s) => redact([...s].join(', ')) || '(none)';
  console.log(`\nWRITE_TARGETS           ${list(written)}`);
  console.log(`READ_TARGETS            ${list(read)}`);
  console.log(`FILES_REFERENCED(heur)  ${list(ref)}`);
  console.log(`COMMANDS                ${commands.map((c) => `[t${c.seq}] ${c.cmd}`).join(' ; ') || '(none)'}`);
  console.log(`ERRORS                  ${[...errored].map((s) => 't' + s).join(', ') || '(none)'}`);
  console.log(`RESULT_ANCHORS          ${[...resultAnchors].map((s) => 't' + s).join(', ') || '(none)'}   ← these turns produced a tool result (traceable, NOT verified)`);
  console.log(`COVERAGE                turns=${turns.length} malformed=${malformed} boundary=${boundary.method}`);
}

// Render a model digest against the map. The name is `sanitize`, not `validate`, on purpose: it checks
// anchor PROVENANCE, not claim truth. The ONE deterministic guarantee — a claim renders as CITED only
// when EVERY anchor it cites was stamped by the map. A claim citing ANY fabricated anchor (or none at
// all) is quarantined to SUSPECT and never shown under its status: a fabricated citation is a
// confabulation signal for the whole claim, so keeping a surviving anchor as a lifeboat is backwards
// (this is exactly the mixed-citation hole that let a false "task closed" render as cited). Even a
// cleanly-cited claim is REPORTED, not verified — anchors point INTO the transcript; the banner and
// footer say to verify against SOURCE / live state before acting. We deliberately do NOT auto-label
// evidenced/reported: the cheap model can't self-calibrate, and a result-anchor only proves a tool ran.
async function cmdSanitize(mapJsonPath, digestPath) {
  const { readFile } = await import('node:fs/promises');
  const map = JSON.parse(await readFile(mapJsonPath, 'utf8'));
  const digest = JSON.parse(await readFile(digestPath, 'utf8'));
  const uuidOf = new Map(map.anchors.map((a) => [a.id, a.uuid8]));
  let dropped = 0;
  const cited = new Set();
  const suspect = [];
  const clean = [];
  const collect = (label, arr) => (arr || []).forEach((it) => {
    const all = it.anchors || [];
    const bad = all.filter((a) => !uuidOf.has(a));
    const good = all.filter((a) => uuidOf.has(a));
    dropped += bad.length;
    if (bad.length || good.length === 0) {
      const cites = good.length ? `cites ${good.join(' ')} · ` : '';
      const fab = bad.length ? `fabricated ${bad.join(' ')}` : 'cites no anchor';
      suspect.push(`${label.trim()}: ${it.text || ''}  [${cites}${fab}]`);
      return;
    }
    good.forEach((a) => cited.add(a));
    clean.push(`${label}  ${it.text || ''}  [${good.join(' ')}]`);
  });
  collect('OBJECTIVE', digest.objective);
  collect('DONE     ', digest.done);
  collect('PENDING  ', digest.pending);
  collect('DECISION ', digest.decisions);
  collect('NEXT     ', digest.next);
  collect('UNKNOWN  ', digest.unknown);

  // Caveat rides IN the artifact (top banner), not just in docs a reader scrolls past: this output is
  // provenance-checked, never fact-checked.
  console.log(`⚠ TRACED, NOT VERIFIED — every line below is a REPORTED claim traced to a turn, not a checked fact.`);
  console.log(`  Provenance-checked (the anchors exist), NOT fact-checked. Verify SOURCE / live state before acting.\n`);
  console.log(clean.join('\n') || '(no cleanly-cited claims)');
  if (suspect.length) {
    console.log(`\nSUSPECT (cites a fabricated or missing anchor — quarantined; NOT traceable, do NOT treat as cited):`);
    for (const u of suspect) console.log(`  ${u}`);
  }
  // Legend maps each cited tN to its turn's uuid8, so the grep-by-id verify path below is executable —
  // the digest only carries tN, which is meaningless against the raw JSONL without this resolution.
  const legend = [...cited]
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
    .map((a) => `${a}=${uuidOf.get(a)}`);
  console.log(`\nSOURCE     ${map.file || map.session}`);
  console.log(`           ${map.window.turns} turns since the ${map.boundary.method} boundary; quarantined ${suspect.length} claim(s), dropped ${dropped} fabricated anchor(s).`);
  console.log(`ANCHORS    ${legend.join('  ') || '(none)'}`);
  console.log(`TO VERIFY  Claims are REPORTED (traced to a turn), NOT verified. To check one before acting on it:`);
  console.log(`             • grep an id's 8-char uuid (from ANCHORS) in the SOURCE file to jump to that turn's record`);
  console.log(`             • confirm the cited turn actually SUPPORTS the claim (transcript), AND — for any`);
  console.log(`               mutable state (merge / CI / deploy / build / device / tracker) — that it holds NOW (live)`);
}

async function main() {
  const { _, flags } = parseArgs(process.argv.slice(2));
  const cmd = _[0];
  if (cmd === 'find' && _[1]) return cmdFind(_.slice(1).join(' '), flags);
  if (cmd === 'show' && _[1]) return cmdShow(_[1], flags);
  if (cmd === 'map' && _[1]) return cmdMap(_[1], flags);
  if (cmd === 'sanitize' && _[1] && _[2]) return cmdSanitize(_[1], _[2]);
  console.error(`recall.mjs — read-only recall over Claude Code transcripts

  find "<phrase>"  [--role user|assistant|tool] [--regex] [--all-projects]
      Parse transcripts BY ROLE (not raw grep) and list matching sessions, ranked with provenance.
  show <sessionId> [--grep "<phrase>"] [--role r] [--since-compact] [--max-chars N]
      Dump a session's substantive turns (tool bodies stripped) for reading / cheap-model summary.
  map  <sessionId> [--since-compact] [--json]
      DETERMINISTIC evidence map: per-turn anchors, files/commands, result-anchor set, coverage.
      Feed the anchored EVENTS to a cheap model; it may only CITE these anchors, never invent facts.
  sanitize <map.json> <digest.json>
      Provenance-check a model digest (NOT a fact-check): a claim renders as cited only if EVERY anchor
      it cites was stamped by the map; any claim citing a fabricated/missing anchor is quarantined to
      SUSPECT. Prints the transcript SOURCE + how to verify a claim. Traced, not verified.

Default scope = current project (cwd -> slug). Never writes. Zero hits ≠ absent.`);
  process.exitCode = 2;
}

main().catch((e) => { console.error(e?.stack || String(e)); process.exitCode = 1; });
