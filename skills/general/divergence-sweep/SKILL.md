---
name: divergence-sweep
description: Use when you need to GENERATE genuinely different options (names, designs, approaches) and a single brainstorm keeps converging on the obvious — fan out agents under decorrelated distant frames, then converge on the tail gems. The inverse of adversarial-pass.
---

# Divergence sweep — break out of the convergent basin

A single model — or a fan-out of *identically-prompted* agents — converges: same prompt → same basin → the obvious answers, dressed up. To get genuinely *different* options, decorrelate the **frame**, not just the seed or temperature.

## When to use
- You need a real spread of alternatives (names, designs, architectures, strategies) and the first pass keeps landing on the same few obvious ones.
- **Not** for converging on truth / pressure-testing a decision — that's the `adversarial-pass` skill (the inverse).

## The method
1. **State what to generate** in one line + what makes a candidate *good* (so you can pick later).
2. **Assign each agent a DISTANT, unrelated frame.** Force the answer to come from a different domain — anatomy, weather, myth, crafts, a foreign language, ecology… Frame diversity moves each agent to a different region of latent space, where *different* answers are the high-probability ones. (This is the lever — not temperature.)
3. **Add a random seed + ban the obvious basin.** Give each a random seed word to bridge from, and explicitly forbid the clichés / the domain you'd default to. Constraints force the tail.
4. **Go cross-model too** (at least two model families, e.g. Codex/GPT and Claude) for extra decorrelation.
5. **Converge: pull the gems from the tail.** Collect all candidates, dedup, select the *remote-but-apt* ones — the surprising-yet-fitting options a convergent pass never reaches. Watch for **convergence-within-divergence**: if many unrelated frames independently land on the same underlying idea, that idea is a real signal (often the load-bearing one).

## Why frames, not temperature
Temperature/seed jitter gives token-level variation *within* the same basin (and degrades to noise past a point). The basin is set by the *conditioning* — so to escape it, change the conditioning (the frame), not the sampler.

## Quick self-test
*Each agent a different distant frame (not one prompt ×N)? · obvious basin banned? · cross-model? · converged on tail gems (not a raw dump)?*

---
*The inverse of `adversarial-pass`: that one decorrelates lenses to converge on truth; this one decorrelates frames to diverge to options. Same fan-out machinery. To activate: copy this dir into `~/.claude/skills/` and `~/.codex/skills/` and restart the tool.*
