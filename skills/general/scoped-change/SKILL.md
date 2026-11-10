---
name: scoped-change
description: Use before and during any code change — to scope it to one reviewable concern, avoid entangling unrelated edits, and report what changed and how it was verified.
---

# Scoped change — one separable concern, reviewable in isolation

Ship a change as **one separable concern**: one idea per change set, understandable and revertable on its own. Smaller, focused changes are easier to review, test, revert, and reason about — so prefer small, but optimize for **separability over line count**.

## Before you edit
- **Name the concern in one sentence**, and **note what's out of scope** (adjacent problems you'll notice but won't fix here).
- **The coupling test for bundling:** an "and"/"+"-list is *one* change only if the parts must be **reviewed, tested, shipped, or reverted together**. If each part could land on its own without breaking the concern, split. (Watch the abuse path — abstracting the "purpose" upward until unrelated work looks related. e.g. "ALB + target groups + listeners" is one unit; "auth + billing + telemetry" is not.)

## While you edit
- **Stay inside the concern.** Don't opportunistically refactor, reformat, or fix unrelated things you pass by.
- **Enabling refactor:** a small preparatory refactor is fine *only* if it directly de-risks the named concern; otherwise split it out and do it first.
- **Find an unrelated bug?** Report it (or file a task) — don't fix it here, and don't drop a code `TODO` unless the repo already tracks work that way.
- **Generated output & formatting:** keep generated files separate from source (a big *regenerated* diff can still be one concern — label it); don't let an auto-formatter sweep unrelated lines — isolate formatting or call it out.
- **A *class* of the same fix is one change** — same defect / mechanical migration with the same verification — not a loose theme, and not split per-occurrence.

## Dependencies & impossible splits
- If change B truly needs change A, **stack** them and land in order — don't bundle.
- If separability would only create broken intermediate states (an API + its callers + migration), keep the **smallest coherent vertical slice** and **say why it can't be split further**.

## Before you finish
- **Re-read the diff** and remove accidental or unrelated edits.
- **State what changed, *why this approach*, and how you verified it** — the concern, the surface touched, **the key alternative you rejected (the *why*) — put it in the commit / MR description** (this is the cheap, git-native decision-trail; *not* a `Claude-Session` line), and the check you ran (tests / build / typecheck / manual repro). If you couldn't verify, say so and name the residual risk.

Quick self-test: *one purpose · revertable alone · doesn't knowingly break the integration target · verification stated.*

---
*Small, focused changes are a reviewability heuristic, not a law — they're easier to review/test/revert because reviewer attention (human or agent) is bounded. Favor them; don't worship them.*
