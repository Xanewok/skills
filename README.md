# skills

Rung-0 agent skills: skills for Claude Code and Codex that need nothing beyond the harness that
loads them. A rung-0 skill names no machine, host or private service, and depends on no tool other
than the vendor CLIs (`claude`, `codex`), Node.js and ordinary shell tools, so it works wherever
either harness runs.

A skill is a directory with a `SKILL.md`: YAML frontmatter with `name` and `description`, then a
markdown body that the agent loads when the description matches the task. The format is the open
[Agent Skills](https://agentskills.io) standard, which both harnesses read.

## Skills

| Skill | Purpose |
|---|---|
| `adversarial-pass` | Red-team a decision about to lock: independent critics with different lenses and model families, keeping only the holes that survive |
| `cli-ux` | Design, change or review a CLI's flags, environment variables, config keys, defaults, prompts, errors and exit codes, and audit an existing tool against the same rules |
| `context-economy` | Keep the per-turn context window small on long sessions, where latency grows with the window: delegate and hand off rather than rely on the cache |
| `divergence-sweep` | Generate genuinely different options by fanning out agents under distant frames, then pick the remote-but-apt ones |
| `first-principles-review` | Review a PR by stating its contract and rebuilding it from scratch before reading the diff, then comparing the two |
| `identify-loose-threads` | Split a long multi-topic session into continuable threads, each with a mode, its material on disk and a self-contained prompt |
| `readable-source` | Write or rewrite source that careful readers will check: removal first, order, names, comments, small proofs, testable claims, and checks that a legibility pass changes no behaviour |
| `recall-transcript` | Find or resume a past Claude Code session without re-reading its transcript: role-aware search and a bounded, source-anchored extract |
| `scoped-change` | Scope a code change to one reviewable concern, and report what changed and how it was verified |
| `asd-ste100` (vendored) | Rewrite English that an agent must parse without asking, such as tool descriptions, errors and inter-agent instructions, as ASD-STE100 Simplified Technical English |

The author's own skills are in `skills/general/`. Third-party skills are in `skills/vendored/`,
kept verbatim and pinned by a note at the top of each `SKILL.md`. Nothing pulls them: to refresh
one, re-clone upstream, diff, and update the note.

## Install and check

```sh
node bin/install.mjs            # copy every skill into ~/.claude/skills and ~/.codex/skills
node bin/install.mjs --check    # compare the installed copies byte for byte; exit 1 if any is missing or differs
```

Restart the harness after an install. An installed copy that nothing compares drifts unnoticed,
so run `--check` after editing a skill here. The installer refuses to write through a symlink or
over a directory that holds its own `.git`, which is another project's checkout.

## How harnesses discover skills

Each harness reads user-level skills from its own home, never from the other's, and discovery
there is flat:
`<home>/skills/<name>/SKILL.md`, where `<home>` is `~/.claude` or `~/.codex`. A `SKILL.md` one
directory deeper is not found, and nothing warns (verified for Claude Code 2.1.277). So skills here
are grouped by directory, and the installer flattens them: the installed name is the frontmatter
`name`, not the path. Two skills cannot share a name; the installer refuses rather than let one
overwrite the other.

## Licensing

- `skills/vendored/asd-ste100/`: MIT, © 2026 Dustin Yuchen Teng, from
  [danyuchn/asd-ste100-skill](https://github.com/danyuchn/asd-ste100-skill). Its `LICENSE` is
  kept verbatim in that directory.
- Everything else (`skills/general/`, `bin/` and these documents): no licence chosen yet. Until a
  `LICENSE` file is added at the root, default copyright applies.
