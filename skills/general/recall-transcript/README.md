# recall-transcript

Read-only recall over Claude Code session transcripts on disk. Find an old session by a remembered
phrase, pull a fact out of it, or reconstruct a cheap task-status handoff from a session whose cache has
gone cold — **without re-ingesting the whole transcript**.

- **Human-facing rationale + design record:** this file.
- **Model-facing operating manual** (when to reach for it, exact subcommands, workflow): [`SKILL.md`](SKILL.md).
- **Implementation:** [`bin/recall.mjs`](bin/recall.mjs) — Node, zero deps, never writes.
- **Tests:** `node --test test/recall.test.mjs`.

## Why it exists

The recurring problem: you come back to a large session (or want to resume one after `/compact`), and
the useful state — decisions, what got merged, what's still open — is buried in a 3,000-line, 400k–1M
token JSONL file. Re-reading the whole thing into a capable model is slow and expensive, and Claude
Code gives you no built-in way to cheaply ask "what happened in *that* session."

Three properties of the on-disk format make the naive approaches fail, and they drove the whole design:

- **No cross-session lineage.** `/clear` mints a fresh session UUID with no parent pointer. With ~6
  concurrent sessions running, file mtime and prompt-time ordering both point at the *wrong* "previous"
  session. → The remembered phrase is the reliable locator, not the clock.
- **`~/.claude/history.jsonl` indexes only user prompts.** Great for "a session where I *asked* X"; it
  silently misses everything the assistant or tools said. → We parse transcripts directly, by role.
- **Never raw-grep the JSONL.** JSON escaping, giant single lines, and role ambiguity produce both false
  matches and missed ones. → We parse and match on content, attributed by role.

## What it does

Four subcommands (full reference in [`SKILL.md`](SKILL.md)):

| command | purpose |
|---|---|
| `find "<phrase>"` | role-aware lexical search across sessions → ranked candidates + provenance |
| `show <session>` | dump one session's substantive turns (fat tool bodies stripped to markers) |
| `map <session> --since-compact` | deterministic evidence map: citable `tN` anchors, write/read targets, commands, result-anchor set, baseline |
| `sanitize map.json digest.json` | provenance-check a cheap model's digest against the map (NOT a fact-check) → a traced handoff |

## The digest pipeline (the interesting part)

For "summarize everything since the last compaction into a structured status list," three steps, and the
**split is the whole point**:

```
map  ──►  deterministic facts + citable tN anchors      (the script; no model)
          │
          ▼
Haiku ──►  anchored claims, JSON only                    (a cheap model; cites, never invents)
          │
          ▼
sanitize ──►  provenance-checked handoff + pointer to source  (the script again)
```

The capable model never produces the facts — it only reads a list where every rendered line is traced to
a turn. `sanitize` is fail-CLOSED: a claim renders as cited only if EVERY anchor it cites was stamped by
the map; a claim citing any fabricated/missing anchor is quarantined WHOLE to a `SUSPECT` block (a
hallucinated citation is a confabulation signal for the claim — the surviving anchors are not a lifeboat).
It prints an `ANCHORS` legend mapping each cited `tN` to its turn's 8-char uuid. That legend is
load-bearing: the digest alone carries only `tN`, which is meaningless against the raw JSONL — grepping
the uuid in the source file is what makes "jump to the cited turn" actually executable. The name is
`sanitize`, not `validate`, on purpose: it checks anchor **provenance**, never claim **truth**. Every
output says so, top and bottom — traced, not verified; verify SOURCE / live state before acting.

### Provenance floor: *traceable, not verified*

A cited line means "this claim was made at this turn," **not** "this claim is true." A `done` in an old
transcript is a claim; CI, a merge, or a device result can have changed since. The design deliberately
does **not** try to auto-label claims verified-vs-asserted — we measured that a cheap model self-labels
100% of its claims "evidenced," so the label is noise. Instead, the handoff hands the capable model the
tools to check what it's about to act on: grep the anchor's uuid to the source turn, or confirm
consequential state (merge / CI / deploy / build / device) against live systems.

## Design decisions worth knowing (built, then unbuilt)

We first shipped a **veto**: the sanitize step (then named `validate`) downgraded any claim labelled "evidenced" that cited no
result-anchor to "reported." A baseline experiment (a real 413-turn SDK migration session, pipeline vs.
a naive "Haiku reads the whole thing and summarizes") showed the veto was mostly **citation-lint, not
calibration** — ~7 of 8 downgrades were citation-adjacency false negatives, and the cheap model labelled
everything "evidenced" anyway. So we trimmed it. What survives is the part that actually pays for itself:
the deterministic **map** (≈4.3× cheaper cheap-model input than a full read) and anchor-existence
sanitization. The lesson: the machinery earns its keep at the *map*, not at a verifier.

## Does it work? (dogfood)

Yes — it can summarize its own build session. Running `map → Haiku → sanitize` on the session that built
it produced a faithful status list (0 hallucinated anchors), and each cited `tN` resolved via its uuid8
to the exact originating turn (`grep <uuid8> <source.jsonl>` lands on it). Cheap-model input for that run
was ~2k tokens against a 3,000-line transcript.

## Run it

```sh
node bin/recall.mjs find "the phrase I remember"
node bin/recall.mjs map <sessionId> --since-compact --json > map.json
# hand the anchored events (map without --json) to a cheap model → digest.json
node bin/recall.mjs sanitize map.json digest.json
node --test test/recall.test.mjs
```

## Not in scope (deliberately)

Semantic/RAG search, embeddings, an FTS index, and Codex-transcript adapters are intentionally left out.
Lexical recall has been sufficient; add these only if it proves otherwise.

## Prior art

The "software emits facts, cheap model cites, deterministic layer checks" split mirrors Microsoft ISE's
*Separating Deterministic Extraction from AI Inference*; anchor-cite-then-verify echoes ALCE /
"Attribute First, Then Generate." The provenance floor (a cited anchor may not *support* the claim —
cf. "Proof-of-Use" decorative tool-calls) is closed by the capable model re-checking live state, not by
this script.
