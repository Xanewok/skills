# Working in this repository

Rung-0 skills for Claude Code and Codex. `README.md` describes the layout, the installer and how
harnesses discover skills.

This repository is public, and its history is permanent: a line removed later stays reachable
through its commit. Everything here must be safe to publish, and useful to someone with a
different machine, employer and setup.

## Adding or editing a skill

- **One skill, one directory**: `skills/general/<name>/`, with `SKILL.md` at its root. Scripts,
  references and tests go inside that directory and are linked by relative paths, because only
  that directory is installed.
- **Frontmatter** carries `name` and `description`. `name` equals the directory name, is unique
  under `skills/`, and stays on one line: the installer reads it with `^name:\s*(\S+)\s*$`.
  `description` says when to use the skill, in the words a user or an agent would use; the harness
  matches tasks against it and keeps it loaded, so it holds the trigger and the scope, nothing more.
- **No private names**: no machine, host or user name, client or employer, person, personal path,
  email address, IP address, private repository or credential, in examples, comments or commit
  messages. Replace one with a neutral example that keeps the meaning (`example.com`, `<repo>`,
  `~/project`).
- **Invented examples and fixtures**: never copy an example, a quote or a test fixture from a real
  session, transcript, log, memory or client repository. That is how private text gets in.
- **No dependency beyond the harness**: the vendor CLIs (`claude`, `codex`), Node.js and ordinary
  shell tools. A skill that needs a private service, a particular machine or an in-house CLI does
  not belong here.
- **No machine setup or private workflow**: configuration for one machine, personal working notes
  and knowledge about a client belong in a private repository.
- **Link only to what ships here.** A reference to a document outside this repository does not
  travel with the skill.
- **Update the skill's row** in the `README.md` table.
- **Vendored skills are not edited.** An edit to `skills/vendored/<name>/` is a fork. Refresh from
  upstream instead, update the pin note at the top of its `SKILL.md`, and keep its `LICENSE`.

## Before committing

```sh
# install into a throwaway home and compare; the real ~/.claude and ~/.codex stay untouched.
# The real binary path, because a version-manager shim may fail to resolve under another HOME.
tmp=$(mktemp -d) node=$(node -p process.execPath)
HOME=$tmp "$node" bin/install.mjs && HOME=$tmp "$node" bin/install.mjs --check
rm -rf "$tmp"

# the skills' own tests
node --test skills/general/*/test/*.test.mjs
```

Then search the staged diff and the commit message, case-insensitively, for machine and host
names, client and employer names, personal paths, email addresses, IP addresses and secrets. Do it
before the commit: after a push, a removal needs a history rewrite and does not fully work. Keep
the list of names to search for outside this repository: the list itself names private things.
Commit with a no-reply author address, not a personal one.
