---
name: readable-source
description: Use when writing, simplifying or rewriting source that people will read closely — published or source-verified contracts, audited code, a library's public face, tests an auditor or a later agent must trust. Covers removal before polish, order and whitespace, names, comments, small proofs, testable claims, and the checks that keep a legibility pass from changing behaviour.
---

# Readable source — code written for the reader who was not there

Some source is its own public face: a verified contract, an audited module, a test suite that
stands as evidence. Its reader is careful, has no access to you, and will act on what the text
says. For that reader legibility is a correctness property: what reads as obvious gets checked,
and what reads as strange gets either trusted blindly or flagged wrongly. Write for one pass, top
to bottom, with no other document open.

## First: which kind of change

A **legibility pass** changes no behaviour; the last section governs it. A **removal** changes
behaviour and is its own change, tested as one. New code follows the rules in between. Say which
you are doing before you start, and never mix the first two.

## Less code first

Before you polish, remove, as its own change. Every line, check, field and comment must earn its place, and the code
easiest to read is the code that is not there. Build the mechanism the rule needs and no more: no
parameter, branch or abstraction for a case nobody has.

An undocumented check is not an unneeded one. Find why it was written; remove it only when you know the reason
and can show that it no longer holds (see "Claims and tests"). A check whose reason you cannot
find stays, and its reason is an open question.

One fact, one expression: when the same rule holds in two places, write it once or write it the
same way. Judge a shared helper from the call site, not from the helper: ask what the reader of
each call must see to trust it, such as the order of events, a bound, who may call, or whether it
can revert or call out. If the helper would hide any of that, repeat the code, or make the
helper's name and arguments carry it. Share a fact, a bound, a formula or a proof freely; they read
the same from every caller. Code that looks alike is not always the same rule. Repetition the
reader can see beats indirection the reader must trace.

## Order and whitespace

Follow the language's conventional order and formatter; where they leave a choice:

1. A header that says what the unit is for, then its contract: what it **maintains** after every
   call, what it **guarantees** to those who depend on it, what it **relies on** and cannot check.
2. The state, because the state is the model. Then events and errors.
3. The public surface, grouped by **who may call**: caller class is the first question of every
   review, and a modifier does not always show it. Then views, then internals.

A function body is paragraphs, one blank line between them: checks and early exits, the state
change, the event, the external interaction. This groups; it never licenses reordering. Do not
split a three-line block to honour it, and hold one convention per file: a reviewer reads an
inconsistency as a signal.

Section markers: a bare label, only where a boundary carries information the code does not show,
such as the caller class. A marker that makes a claim duplicates the header and will rot.

## Names and references

- One term per concept, the same in code, tests and documents: a synonym reads as a second
  concept. Renaming a public name is an interface change, not a legibility pass.
- Use a platform's or a library's term only in its established meaning, and give your own concept
  a name of its own. Name an identifier for what it identifies, with its layer when two could be
  confused: an application id, a transport id.
- Published source travels without your repository: link to no document that will not travel with
  it. Use a property id only if the same file defines it on the header line that states the
  property; do not explain the convention, and leave the ids out if they have gaps.

## Comments: only what the code cannot say

First make the code say what it can. Then comment what a careful reader would not see at once,
and nothing else:

- **Why**, when the reason is not visible: the constraint, the incident, the external fact. For a
  check, or a shape that looks reducible, the reason is what breaks without it: "otherwise a
  repeated message pays twice". This is the comment that saves the next editor. When several
  checks keep one invariant, say what each one prevents; a check that no invariant needs says
  what else it serves, or becomes a candidate for removal under "Less code first".
- **The invariant a transition keeps**, at the transition: a setter says what ordering it
  preserves, a loop says what holds each time round.
- **A deviation from the expected order**, where it happens: an interaction before its effects
  says why, and what it relies on.
- **Unreachable code kept on purpose**: why it is unreachable, and what it guards if that changes.

State a comment as a contract to uphold, never as a narration. Every comment is a claim a careful
reader will test, and a false one costs more than a missing one: re-verify every claim you touch,
inherited ones included ("once", "always", "only", "exactly", sizes, what another component does).
Write a premise as a premise: "the facts received so far say the count is final", not "the count
is final".

## Small proofs for unchecked steps

Every narrowing cast, unchecked arithmetic block, unsafe call or skipped validation carries a
one-line proof under a greppable marker, such as `// SAFETY:`, next to the check it cites. A proof
may cite only what a reader can confirm without leaving the function: operand types, a check in
the same function, a bound a callee documents, a constant fixed at construction. If the step rests
on a state invariant or on another party, it is not proved: write "relies on" and name the
assumption, so that the marker finds proofs and nothing else.

## Claims and tests

For claims and tests you add or change:

- **A premise list is testable.** When text says an invariant rests on certain checks, remove
  each check in turn, in an isolated copy, from a passing baseline. It counts as detected only if
  an assertion of that property fails, not a build error. A mutation that survives means another
  check enforces the property, the mutation missed, or a test is missing: find out which before
  you touch the claim. Mutations never land; confirm the unmodified code still passes. Careful
  reviewers often miss a wrong list of premises; a mutation run often catches it.
- **A test is evidence only if it can fail.** Show once that its assertion catches the fault it
  claims to, by breaking the line it guards, and record the line and the failed assertion.
- **Assert the promised outcome**: the state that results, the return value, the failure by its
  error, the event. That a call returned proves nothing unless returning is the property.
- **Do not require a fuzz or invariant run to reach a state** unless the generator guarantees it:
  some valid histories never do. Prove reachability with one deterministic test, and let the
  random runs check what must always hold.
- **A test's name promises what it asserts**, and nothing more.

## A legibility pass must not change behaviour

Declare the constraint before you start, and check it mechanically:

- Same observable behaviour: same return values and failures for the same inputs and states, same
  writes, same events, same external calls in the same order.
- Public interface unchanged. Data layout unchanged: diff the compiler's layout output.
- Run the full tests and whatever rehearsal or proof canary exists; report the numbers before and
  after, and any check you could not run.

Where such passes actually break things:

- **A state read moves across an external call.** Hoisting checks to the top and reading a value
  "near its use" looks tidy, and changes what the callee can influence. Read everything the
  decision needs before you call out.
- **A check merges or reorders** so that a different failure wins for some input.
- **A comment is strengthened while it is polished.** "Usually" becomes "always".
- **A "simplification" removes a guard whose reason was never written down.** That is a removal,
  not a pass: see "Less code first".

Then get a review from a model of another family, with the code, the diff and these constraints,
and without your conclusions. Ask first for behavioural differences, each with the input that
shows it, then for style. Verify every finding against the current code: a reviewer that resumes
an old session may compare against a version that no longer exists.

## Language notes

- Solidity: [references/solidity.md](references/solidity.md)
