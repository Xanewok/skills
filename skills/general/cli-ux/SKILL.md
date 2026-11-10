---
name: cli-ux
description: Use when designing, changing or reviewing a CLI or developer tool's flags, environment variables, config keys, defaults, prompts, errors or exit codes — and to audit every argument of an existing tool against the same rules.
---

# CLI and developer-tool UX

## The rules

1. **Correct by default.** The usual path needs no flags, and the default is the safe choice.
2. **Infer what can be inferred.** A signer's address, a chain id or a node type is never typed:
   the tool reads it from the key, the node or the config.
3. **Ask only where no safe default exists**: an irreversible send on a live system, or a choice
   the tool cannot make. The confirmation names exactly what happens ("send 3 transactions from
   0xab… on chain 1"), never a bare "continue?".
4. **Require explicit input where a guess is dangerous.** A live-system identity (sender, account,
   target) is never defaulted silently. Explicit can mean chosen once in a committed file (a pin)
   or by the act of signing — but never guessed.
5. **One name, one meaning, in every command.** The same flag, variable or key means the same
   thing in every command that takes it. A flag that does not apply is refused, never ignored.
6. **One source per setting, with a documented precedence**: flag over environment variable over
   file over inferred default. Print the resolved value and its source before acting
   (`deployer 0xab…, from network.json`).
7. **Every error names its fix, and each exit code has one meaning.** The message says what was
   found, what was expected, and the command or edit that resolves it.

## How the rules combine

- A committed pin beats an inferred default: when the config pins an identity, every command
  defaults to the pin, and a run that cannot act as it refuses **at start**, not at the step that
  needs it.
- Check at start everything that can be checked at start (signer, chain, node, clean tree). A
  refusal after the first irreversible action leaves a half-done state.
- Escape hatches are long, named for the risk (`--unsafe-…`, `--allow-dirty`), apply to one
  narrow check, print a warning when used, and are refused where they have no use. An escape
  hatch is a person's decision, never the advertised way past a refusal.
- Unattended runs (CI, local dev chains) never prompt; they refuse where an attended run would
  ask. Detect the mode from facts (terminal, `CI`, chain kind), not a flag.
- A refusal that has no safe default says so ("a person must resolve it") instead of suggesting
  a workaround.

## Auditing an existing tool

Build one table, a row per input (flag, environment variable, config key) per command:

| input | commands | meaning | default and its source | required when | validated how | error and fix |

Then flag each row that breaks a rule: a typed value the tool could infer (2), a silent default
for a live identity (4), a name whose meaning differs by command or a flag silently ignored (5),
two sources without a stated precedence or an unprinted resolution (6), an error without a fix or
an exit code reused for two meanings (7). Fix by inferring, pinning, refusing or renaming — prefer
deleting an input over documenting it.
