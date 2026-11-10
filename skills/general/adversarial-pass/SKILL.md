---
name: adversarial-pass
description: Use at a decision-lock (an ADR/MR/design/plan about to finalize) to red-team it — fan out independent cross-model critics with decorrelated lenses, collect the holes, keep only what survives. Inverse mode (divergence sweep) for generating options.
---

# Adversarial pass — punch holes before you commit

When a decision is about to lock (an ADR, an MR, a design, a plan), don't trust a single read — **including your own**. Spawn independent critics, each told to *break* it, then keep only the holes that survive scrutiny. A single reviewer (or the author) shares the author's blind spots; the value is in *decorrelated* attacks.

## When to use
- A decision is about to finalize and reversing it later is costly.
- You (or one agent) produced something and want it stress-tested before acting on it.
- **Not** for trivial or easily-reversible changes — this costs spawns + wall-time. Match the rigor to the stakes.

## The method
1. **State the target in one line** — the exact claim / plan / artifact under review, and what *"it's wrong"* would concretely mean. Vague targets get vague critiques.
2. **Decorrelate the critics — different LENSES, not the same prompt N times.** Same prompt → same basin → convergent agreement (false comfort). Give each a distinct angle (e.g. *cut-it-all · ROI/market · will-it-break/architecture · opportunity-cost*). Frame diversity is what surfaces *non-overlapping* holes.
3. **Decorrelate the MODEL too.** At least two model families, e.g. one Codex/GPT **and** one Claude. Different training → different blind spots. Same model in N lenses still shares one prior.
4. **Tell each to BREAK it, not balance it** — *"make the strongest adversarial case, cite specifics from the artifact, no hedging, end with the single change you'd force."* A critic told to be fair produces mush.
5. **Adjudicate — separate hits from rhetoric.** *Before reading the critiques, pre-register what makes a hole "land":* it cites a real specific from the artifact **and** would survive a named rebuttal — so the adjudication can't be retrofitted to the answer you wanted. Then, per hole: does it clear that bar, or is it vibes/overreach (adversaries overreach by design)? Keep what **lands**; name what's **rhetoric** and why. *The adjudicated synthesis is the deliverable — never a raw dump of critiques.*
6. **Decide** — what you change, what you keep, what you *consciously accept* despite the critique.

## Cross-model fan-out (the mechanism, if another vendor's CLI is present)
```
# one critic per lens, one-off → stdout, run in background, collect:
codex exec --sandbox read-only "<lens A: be the abolitionist… BREAK this: <target>>"   # GPT
claude -p --tools Read,Grep,Glob "<lens B: ROI realist… BREAK this: <target>>"          # Claude
# inside Claude Code, a Claude lens can also be a subagent (Task/Agent) reading the same artifact.
```
Read each output, then do step 5. (No CLI? Use the solo fallback.)

## Solo fallback (cheap mode)
No spawns worth it / offline: run the lenses yourself, **one at a time in separate passes**, writing each before reading the next so they don't blur. You lose model-diversity (your own blind spots stay) — so use only for lower stakes.

## Generating options instead of breaking one?
Reach for the **inverse** — the `divergence-sweep` skill: same fan-out machinery, but decorrelate the *frame* (not the lens) to diverge to options rather than converge on truth.

## Quick self-test
*Distinct lenses (not one prompt ×N)? · cross-model (not one model)? · told to break, not balance? · adjudicated hits-vs-rhetoric (not a raw dump)? · a decision came out the other end?*

---
*Spawns cost tokens + wall-time — reserve the full fan-out for genuine decision-locks; a single consult or the solo fallback is fine for smaller calls. To activate: copy this dir into `~/.claude/skills/` and `~/.codex/skills/` and restart the tool.*
