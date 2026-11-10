---
name: identify-loose-threads
description: >-
  Split a long brainstorm, research, or multi-topic session into distinct continuable threads,
  each with a mode (decision / research / deliverable / blocked), its verified material on disk,
  the decisions already made, and a self-contained prompt that a fresh agent of any vendor can
  start from, including how to get back into this session's transcript. Use when the user says
  "what threads do we have", "split this session", "what's still open and actionable", "give
  each thread a prompt", or before a handoff when one session has grown several topics.
---

# identify-loose-threads

Output: a **thread map**. One header line, then one block per thread. A thread is work one
agent can pick up alone. Resolved work is left out. The map is the deliverable; do not write
the threads' notes unless asked.

## Header (one line)

`session: <id> · window: whole | since compaction <uuid8> · anchors: map | none`

- If the window is since-compaction, the compaction summary sits outside it: read that record
  once and treat its open items as candidates, or they vanish.
- `anchors: map` when `recall-transcript map <session>` was run (Claude Code transcripts).
  `anchors: none` when working from live context only (Codex, or no transcript). Both are fine.

## Find candidates

Walk the session once and list anything that anchors to:
- a **user ask** (not an acknowledgement or a reminder ping);
- a **decision handed back** to the user, not yet picked;
- an **artifact produced** (note, PR, memory, script — every file written; list them from
  context and `ls` of the note dirs, the `map` WRITE targets miss files written through shell
  heredocs);
- a **tool-born investigation**: several turns chasing something no user message asked for.

Then check coverage both ways: every user ask and every written file belongs to a thread, or
is marked `answered in place` / `scratch` with a few words why. Empty lists before emitting.

## Keep, drop, merge

- **State comes from the latest turn on the thread.** A decision reversed later is one thread
  whose `decided` line cites the reversal, latest first.
- **Drop threads resolved inside the window** (merged, answered, note written and nothing
  follows). Name their artifacts in one footer line.
- **Merge only on a shared deliverable path or a shared gating decision** (an ADR, a tracker
  id, a named open decision). Overlapping topics stay split, with `possible merge: #N` in
  `open`. A candidate that is research *then* delivery is two threads; the second's prompt
  says which note it needs first.
- **Follow re-file chains.** A cancelled or closed task may say "re-filed as" or hand its
  decision to another id; read the status line and the last log entry of every id you cite,
  and follow the pointer to the live one before calling anything undecided.
- **Do not re-create tracked work.** `rg -l` the topic over the tracker, handoffs, staging
  notes, and the memory index. A thread that already has an id is listed under it in
  `material`. If those dirs are unreadable, say `tracker: unchecked` in the header instead of
  guessing.

## Material: exists, reachable, current

Every path listed passes three checks now: `ls` it; it must be **persistent** (repo, tracker
checkout, note dirs, skills dirs — not a session scratchpad or task output dir; copy such files
out first or mark the thread `MATERIAL GAP`); and it is **current** — if a later turn
superseded it, say so next to the path. Existence is not currency.

`MATERIAL GAP` = the thread lives only in the transcript. Then the prompt's first step is to
write the note, using the session anchor below.

## Modes (one per thread)

| mode | next step belongs to | stops when |
|---|---|---|
| decision | the user | options with evidence are presented, or the fact only the user has is supplied |
| research | agent | the named note is written and indexed |
| deliverable | agent | PR / commit / docs / tracker rows land with evidence |
| blocked | an external event | the named event happens; give the poll or exit condition |

Tracker and docs sync is `deliverable`. A spike is `research`; a spike without a note is lost.

## Per-thread block

```
### N. <thread> — <mode>
material: <verified persistent paths; tracker id if any; SUPERSEDED notes> | MATERIAL GAP
decided: <do-not-reopen lines, latest first>
open: <what the next agent must not decide alone; possible merge: #N>
prompt: |
  <self-contained: files to read first, the task, the artifact and its path, the stop
   condition, the decisions not to reopen, the harness's report contract by path
   (~/.claude/CLAUDE.md or ~/.codex/AGENTS.md)>
  session: <id> — recall phrases: "<exact phrase 1>", "<exact phrase 2>"
```

**The session anchor is mandatory on every prompt.** `recall-transcript find "<phrase>"` is a
Node script that reads Claude Code transcripts on this machine; the copy under
`~/.codex/skills/recall-transcript` is identical, so a Codex agent here can use it too. Phrases
are exact lines from the session (a heading, a sentence the user wrote), taken from the live
context or the `map` text, never by re-reading the transcript. An agent off this machine cannot
recall, so for it the material list is the whole handoff: keep it persistent.

## Where it goes

The project's handoff location, whatever the project calls it (a dated file such as
`handoff-YYYY-MM-DD-<slug>.md` is the common shape; run `date` first). No such place: print it and say so. Order the blocks so that threads with no
prerequisites and mode `decision` come first — they unblock the rest at the lowest cost.

## Context budget

Read only what is already in context, the `map` text if any, and `ls`/`rg` results. Never
`show` per thread; never open the material beyond confirming it exists and its date.

## Extensions — add only when they carry information

Not part of the block by default: a `depends-on: #N` line (use when a prompt literally cannot
start without another thread's artifact), a summary table at the top (use above ~8 threads), a
`lifecycle` note (use only for a reopened thread). Anything else is schema for its own sake.

## Self-test

header present · both coverage lists empty · no resolved thread in the map · every path
persistent and checked · every prompt has a stop condition and a session anchor
