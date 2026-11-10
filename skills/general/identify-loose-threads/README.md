# identify-loose-threads — why this shape

Born 2026-09-04 from a session that had grown ten product-design and research topics. A
hand-made map worked but had four weaknesses: threads found by intuition, no
merge/split test, material sometimes only in the transcript, and mode implicit in prompt wording.

A draft with three improvements was critiqued by two models (Claude Fable, GLM 5.3 via codex).
What they changed:

- Anchor type (d), tool-born investigations, and coverage over WRITE targets, not only user
  messages (both critics: user-message coverage proves nothing).
- State from the **latest** anchor; reversals cite both turns; resolved threads excluded.
- Window line + BASELINE summary items, because `--since-compact` hides pre-compaction threads.
- Merge test made mechanical (same deliverable path or same decision id); the `scoped-change`
  code-coupling analogy was dropped as undecidable for research threads.
- `tracker: UNCHECKED` when the tracker dir is unreadable, instead of a silent blank.
- Material classified persistent/ephemeral and checked for currency, because scratchpad paths
  die with the session and `ls` proves existence, not truth.
- Modes `question` and `blocked` added; dual-natured threads become two threads with
  `depends-on`, keeping modes exclusive.
- Context bound: `map` text and digest only, never `show` per thread.
- Codex fallback made explicit: `anchors: none`, artifacts from `git status` and note dirs;
  `recall-transcript` does not index `~/.codex/sessions`.

Deliberately not done: a script. The steps are checks over lists the agent already has; the
self-test list is the enforcement. Add tooling only if maps start failing the self-test.

## Taste pass (2026-09-04)

The first refined version had seven modes, a seven-column table, `depends-on`, `lifecycle`,
`tracker` per thread, and a nine-item self-test. The owner: "settling on a lean core that can be
extensible is better and curates context better for agents rather than pretending we have more
structure that would be rarely used" — an over-specified tracker schema had confused agents the same
way. Cut to: one header line, four modes (question → decision, housekeeping → deliverable), a
five-field block, and an Extensions section for `depends-on` / table / `lifecycle` used only when
they carry information. Added at the same pass: the **session anchor on every prompt** (session
id + exact recall phrases), verified cross-vendor — the Codex copy of `recall-transcript` reads
Claude transcripts on this machine (`find` on an exact line of this session, run from
`~/.codex/skills`, resolved to this session). Off-machine agents cannot recall, so material must be persistent for them.
