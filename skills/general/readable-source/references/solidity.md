# Readable source: Solidity

Assume the contract will be source-verified. The verified page is what users, integrators and
auditors read, file by file, without your repository.

## Layout

Follow the Solidity style guide inside a contract: type declarations next to the state they
shape, state variables, events, errors, modifiers, functions. Order the functions: constructor,
then external functions grouped by caller class (owner, a bound counterparty, anyone), then
views, then internals. Keep a modifier next to its only users when it has few.

Never reorder state variables in a legibility pass. Diff the layouts to prove it:

```sh
forge inspect <Contract> storage-layout --json | jq '[.storage[]|{label,slot,offset}]'
forge inspect <Contract> abi --json | jq -S .
```

The compiler's internal type ids change with any edit, so compare label, slot and offset only.

## Checks

Prefer `require(condition, CustomError())`. It needs solc 0.8.26 with via-IR, or 0.8.27 and later
with the legacy pipeline. The error's arguments are evaluated even when the condition holds, so
keep them free of side effects.

When you convert `if (a || b) revert E();` write `require(!a && !b, E());` and check the negation
by hand. When one condition chose between two errors, keep the order in which they win.

A function body reads: requires, blank line, effects, blank line, `emit`, blank line,
interaction.

## Checks-effects-interactions

Hold to it, and where you cannot, say so in place. The common honest exception is a credit
measured as a balance difference around a transfer: the transfer must come first. State what
the code then relies on, and read every other piece of state the function needs before the call.

## SAFETY comments

One line above each `unchecked` block and each narrowing cast:

```solidity
// SAFETY: uint88 * uint16 < 2^104, and three such terms sum below 2^106. By types alone.
unchecked {
    total = uint256(a) * rateA + uint256(b) * rateB + uint256(c) * rateC;
}
```

Allowed grounds: operand types, a check in the same function, a bound a callee documents in its
NatSpec by types, the constructor's check on an immutable. When wrapping is the intent, as in
address aliasing, say that: the proof is that the modulus is the type's.

A function whose result other SAFETY comments cite must state that bound in its own NatSpec.

Put a division or cast that appears more than once into one small internal function, so that
there is one proof.

## NatSpec

`@notice` for what a caller needs, `@dev` for why and for invariants, `@param` only when the
name does not say it. Give struct fields a trailing comment when the unit or the meaning is not
in the name. Say how many storage words a packed struct takes only after you have counted the
bits. For state that the contract writes and never reads, say who reads it.

## Before you call it done

`forge fmt --check`, the full test suite, the gas bound if one exists, the deployment rehearsal
if one exists, and one symbolic or fuzz canary with its path count before and after. Every
bytecode change makes earlier proof results stale: say so where the evidence is recorded.
