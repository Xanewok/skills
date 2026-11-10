---
name: context-economy
description: Keep the per-turn context window small — on large Opus sessions the felt bottleneck is LATENCY (and the bill), not capability. Measured ~8× first-reply tax from <200k to 800k+ context, cliff ~200k. Read when a session is growing large, before spawning subagents, or when deciding to hand off / compact; the lever is delegation + session hand-off, NOT cache tricks.
---

# Context economy — the latency lever

On large Opus sessions the felt bottleneck is **latency** (and the bill), not capability. Measured
2026-06-16 across 4 real sessions: median "your message → first reply" is **~8s at <200k context** but
**~1.1m at 800k+** — an **~8× tax**, cliff at **~200k**. Cache already hits (`fresh-tok ≈ 0`), so the
cost is **attention over the absolute window size, not prefill** → *only a smaller window helps, cache
tricks don't.* Multi-day sessions drift to ~380k median → the slow band by default.

## Two layers

**Frugality — universal, every agent (not just coordinators):**
- Concise output; don't dump big Read/Bash results into the window (they tax *every later turn*).
- Targeted reads (`offset`/grep/summarizing-subagent) only when a source is **large AND you need just
  part of it** (or it's a log/lockfile/transcript). Otherwise read normally and trust harness defaults
  (≤2000-line reads, auto-compaction). Don't over-select.

**Coordination levers — capability-gated** (only a node holding the spawn/`Agent` tool — a
*coordinator*, not necessarily the root; recursive):
1. **Hand off / compact at task boundaries** — the biggest lever, and **free** (the main session stays
   sub-billed). Ending sessions beats running multi-day.
2. **Substitutive delegation**: offload reads to a subagent so only distilled results enter the
   window — **replace** a main-loop read, don't add one on top.
3. **Don't persist big outputs.**

## Billing (empirical)
In-session subagents draw the **subscription weekly limit**, *not* a credit pool (that's headless
`claude -p` / SDK / Actions). So delegation isn't a separate $ meter — but it spends a finite weekly
budget.

## The trap this skill exists to avoid
**Do NOT bake these levers into CLAUDE.md / AGENTS.md** (always-loaded). Verified: subagents *inherit*
always-loaded content, re-processed every turn → inherited-bloat + tool-surface/recursion risk. This
skill IS the fix — a ~1-line description surfaced every turn, the body loaded only on invoke.

## Deploy
A skill is only *active* once it sits in each tool's own global directory. Install every skill in this
repository with `node bin/install.mjs`, and `node bin/install.mjs --check` to find a copy that has
drifted from its source here.
