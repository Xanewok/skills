#!/usr/bin/env node
// install.mjs — copy every skill in this repository into each agent harness's own skill directory,
// or --check that the installed copies still match.
//
// Why a copy at all: each harness reads ONLY its own global directory, and skill discovery there is
// FLAT — `~/.claude/skills/<name>/SKILL.md` and nothing deeper. Verified 2026-09-19 against Claude
// Code 2.1.277: a skill one directory further down is not discovered, and nothing warns. So the
// grouping below exists in this repository and is flattened on the way out.
//
// A copy drifts, which is the whole hazard, so `--check` is the point of this script rather than an
// afterthought: it byte-compares and names what to re-run.
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, 'skills');
// One per harness. A skill installed for one is invisible to the other.
const HOSTS = [join(homedir(), '.claude', 'skills'), join(homedir(), '.codex', 'skills')];

// Skills may sit at any depth under skills/ — group them however you like (general/, vendored/, …).
// The installed name comes from the frontmatter, never the path, because the path is not what the
// harness sees.
function discover(dir, found = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (!e.isDirectory()) continue;
    if (existsSync(join(p, 'SKILL.md'))) found.push(p);
    else discover(p, found);
  }
  return found;
}

const nameOf = d => {
  const m = readFileSync(join(d, 'SKILL.md'), 'utf8').match(/^name:\s*(\S+)\s*$/m);
  if (!m) throw new Error(`${relative(ROOT, d)}/SKILL.md has no \`name:\` in its frontmatter`);
  return m[1];
};

// Recursive byte comparison. Reports the first difference per skill: one is enough to act on.
function differs(a, b) {
  if (!existsSync(b)) return 'not installed';
  const walk = (ra, rb, rel = '') => {
    const names = new Set([...readdirSync(ra), ...(existsSync(rb) ? readdirSync(rb) : [])]);
    for (const n of names) {
      if (n === '.git') continue;
      const pa = join(ra, n), pb = join(rb, n), r = join(rel, n);
      if (!existsSync(pa)) return `extra file: ${r}`;
      if (!existsSync(pb)) return `missing file: ${r}`;
      if (statSync(pa).isDirectory()) { const d = walk(pa, pb, r); if (d) return d; continue; }
      if (!readFileSync(pa).equals(readFileSync(pb))) return `differs: ${r}`;
    }
    return null;
  };
  return walk(a, b);
}

const check = process.argv.includes('--check');
const skills = discover(SRC).sort();
if (!skills.length) { console.error(`no SKILL.md found under ${relative(process.cwd(), SRC)}`); process.exit(2); }

const seen = new Map();
let stale = 0, installed = 0;
for (const dir of skills) {
  const name = nameOf(dir);
  // The harness namespace is flat, so two groups cannot both own a name — and the loser would simply
  // be overwritten here without a word.
  if (seen.has(name)) { console.error(`✗ two skills are both named "${name}": ${relative(ROOT, seen.get(name))} and ${relative(ROOT, dir)}`); process.exit(2); }
  seen.set(name, dir);
  if (basename(dir) !== name) console.warn(`  note: ${relative(ROOT, dir)} installs as "${name}"`);

  for (const host of HOSTS) {
    const target = join(host, name);
    if (check) {
      const d = differs(dir, target);
      if (d) { console.log(`✗ ${name} → ${target}: ${d}`); stale++; }
      continue;
    }
    // Refuse a symlink rather than write through it: two chained symlinks into a live tree once made
    // an edit here silently rewrite what other sessions were reading.
    if (existsSync(target) && lstatSync(target).isSymbolicLink()) { console.error(`✗ ${target} is a symlink — remove it first`); process.exit(2); }
    // A target carrying its own .git is somebody else's repository (a third-party skill cloned in
    // place), not a copy of ours to overwrite.
    if (existsSync(join(target, '.git'))) { console.error(`✗ ${target} is a git checkout of another project — not overwriting`); process.exit(2); }
    mkdirSync(host, { recursive: true });
    rmSync(target, { recursive: true, force: true });
    cpSync(dir, target, { recursive: true });
    console.log(`${target}`);
    installed++;
  }
}

if (check) {
  if (stale) { console.error(`\n✗ ${stale} installed copy/copies differ from this checkout — run: node bin/install.mjs`); process.exit(1); }
  console.log(`✓ ${skills.length} skill(s) match this checkout in both harnesses`);
} else console.log(`✓ ${installed} copies written (${skills.length} skills × ${HOSTS.length} harnesses)`);
