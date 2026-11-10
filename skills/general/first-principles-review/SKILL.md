---
name: first-principles-review
description: Blinded-rebuild review that keeps only what a PR needs for correct functioning, legibility and understanding — state the contract, rebuild it from scratch BEFORE reading the diff in detail, then diff the PR against that rebuild. Use pre-PR (author), on an open PR (reviewer/on-demand), or as a periodic sweep over open PRs.
---

# First-principles review — rebuild it, then diff against reality

A line-by-line review checks each hunk against itself; it cannot see that a PR is 6× its
contract, or a defect that only appears once an independent implementation exists to
compare against. This is a second, orthogonal pass, not a replacement for the repo's own review guide: if the repo
has a `REVIEW.md` (or similar), read it first and follow its conventions; its rules on what is
irreducible and on contracts and guards are what the rebuild operationalizes.

**What it verifies:** that the diff matches a clean reading of the *stated* contract. It does
NOT verify that the contract is right — author and rebuilder share priors (N-version bound),
so a shared misreading passes both. Contract correctness is the owner's and the spec's job.

## When to use

- **Author, pre-PR.** Steps 1–2 on your own branch before opening the PR; the contract and
  rebuild sketch go into the PR description (the sections the repo's template asks for). Single pass.
- **Reviewer, on-demand.** An open PR about to merge, or one that feels large for its
  contract. Read-only, own worktree, no PR comment — same posture as `code-review`.
- **Periodic sweep.** Every open PR the repo's review guide marks for review; one row per PR
  (verdict + split) wherever the repo tracks its review queue.
- **Single pass (no second reviewer) when the diff is under ~50 lines.**
- **Not a bot-panel lens.** An automated review engine that hands a lens one packet already
  containing the diff cannot blind it; blinding needs
  sequential tool calls, and a "don't peek" instruction inside one prompt is not enforced.

## The method

1. **Contract.** Two sentences, derived from the PR body AND the code — the body may
   overclaim. Name the user- or operator-visible failure on `main` without this PR; verify
   it in `main`'s code and cite `file:line`. Not found on `main` → say so; that alone can
   drive `drop`.
2. **Blinded rebuild.** Read only the PR title/body and `main`. Do not open the diff yet.
   Write the smallest maintainable implementation of the contract given what already exists
   (helpers, library features, config knobs); count files and ~LOC. Write it to a file
   BEFORE the tool call that reads the diff — ordering is enforced by tool calls, not prose.
3. **Compare, hunk by hunk.** Against the rebuild: scope beyond the contract, duplication of
   existing code, defensive machinery for an unreachable state, description/test weight out
   of proportion. Then the reverse: what the PR handles that the rebuild misses, and whether
   that case is real (a real miss argues `keep`). **Fixation guard:** name one design the
   diff suggests that your rebuild did not consider, and say why it loses or wins —
   reviewers fixate harder on their own first idea than on a provided one.
4. **Check the bar.** Minimize reviewable code, never reviewability — cite it
   per cut. Never cut: a test that would fail if the implementation were mutated to be wrong
   (name the mutation), error handling for a reachable state, a comment carrying non-obvious
   why/contract/gotcha. Simplify by removing scope or duplication, never by collapsing
   readable syntax; a 14-line file with a 7,741-char line is smaller and worse.
   **Test-cost guard:** a "add discriminating tests" nit for a guard that is visible in
   the diff defaults to WONTFIX when the seam needs module-level mocks of the platform
   (`react-native`, `expo`, native SDKs) or a DI parameter added to production code only
   for the test — the harness costs more than the guard, and it ratchets (first run: a
   97-line loader + seam for two 3-line guards bought a demand for a third).
5. **Verdict.** `keep` | `trim` (exact hunks) | `rewrite` (minimal sketch: files, shape,
   ~LOC, what it loses) | `drop` (contract not worth code, or satisfied elsewhere). Be
   willing to say `keep` — a manufactured simplification is worse than none.

**Evidence discipline.** Re-grep every `file:line` before the verdict; do not carry citations
from memory. Any claim about tool/environment behaviour (how `npx` resolves a version, what
a CLI reads, what a runtime does outside your checkout) is `unverified` unless you executed
it — a confidently stated pin was overruled this way on the first run of this method.

## Output schema

```
Contract: <2 sentences>
Failure on main: <file:line, or "not found on main">
Size: PR <files>/+<N>/-<N>  vs  minimal <files>/+<N>/-<N>
Verdict: keep|trim|rewrite|drop
Drop: <hunk file:line — reason>          (omit if keep)
Rebuild misses: <what the PR handles that the rebuild doesn't; real or not>
Alternative considered: <the design the diff suggests; why it loses/wins>
Uncertainty: <case not verified, and the check that would settle it>
```

## Two-reviewer + owner-arbiter protocol

Diff ≥ ~50 lines: two independent reviewers (different models) on the SAME neutral brief —
hand over the contract and the code, never your thesis about what is wrong. Each is blind
to the other.

- **Agree:** adopt.
- **`rewrite` / `drop` needs both.** A reviewer judging a diff against its own rebuild is
  self-evaluation, and models favour their own generations; a structural verdict stands
  only when the other reviewer's independent rebuild also finds the diff exceeds the
  minimum. Single-reviewer `rewrite`/`drop` is reported as a recommendation, not a verdict.
- **Split:** the owner arbitrates — a human, never a third model (judges prefer the longer
  report). Before overruling a side, test its claim against every hunk it covers. Record
  the call and its reasoning in the implementation brief.
- **Track the overturn rate.** When a class of finding is repeatedly overruled, stop
  asserting it at the same confidence — a checker that is often wrong gets ignored.

## Handoff — implementation brief

Own file, not the PR body: workspace + rebase instructions; numbered synthesis items citing
both reviewers' evidence and the owner's call at each split; the gates (component-local
typecheck/lint/format/tests from that component's README); the body rule (redraft to the
template, SHRINK — no round chronology, no refutable absolutes, every claim true at the final
head); the return contract (final sha, files/+/- before vs after, gate outputs, what was NOT
done and why). Implement the synthesis, not one reviewer's report.

## Cost and evidence

One worktree + one agent run per PR per reviewer (~100–150k tokens at frontier effort). First
run (2026-08-27, 8 PRs): ~2,400 added lines → ~400 minimal; two defects a line-anchored
review had passed; 5/8 splits. Supporting literature: scenario/requirement-first reading
+35% detection over ad hoc and checklist (Porter, Votta & Basili 1995); independent artifact
then compare, in code, +18.8pp pass@1 (CodeT, ICLR 2023); reference-guided judging cut LLM
judge failure 70%→15% (Zheng et al. 2023, math). Against, and the source of the guards above:
self-generated-concept fixation (Leahy et al. 2020), LLM self-preference in judging
(Panickssery et al. 2024), critic hallucination rising with critique length (McAleese et al.
2024). No published precedent names this exact method — treat it as ours, and measure it.
