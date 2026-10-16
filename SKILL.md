---
name: new-sdlc-project
description: Create a new project with the core AI-native SDLC kit (intents/ with types and gates, REVIEW-POLICY.md, sdlc.md, the /intent /review /grid skills, implementer and reviewer agents for Claude and Codex, check:intent, sdlc:scan), git-initialised, verified and committed in one step. Use when the user wants to start a new project or repo "with the AI SDLC", "with intents and review gates", or "with the SDLC kit".
metadata:
  version: 0.2.0
  source: https://github.com/evarnild/ai-sdlc-kit
---

# Create a project with the core AI-native SDLC

Everything is in this skill's folder (normally
`~/.claude/skills/new-sdlc-project/`):

- `scaffold.mjs` copies, fills, initialises git, verifies and commits. It
  needs Node 22 or later and git.
- `template/` is the kit, with `{{NAME}}`, `{{OWNER}}`, `{{DATE}}`,
  `{{PATH}}`, `{{DESCRIPTION}}` and `{{STACK_*}}` placeholders and
  `__NAME__` file names.

## 1. Get the inputs (one question round at most)

- **name** (required): kebab-case; it becomes the project folder. If the
  user didn't give one, ask; never invent one.
- **where** (optional): the parent folder. Default: the current working
  directory. If that is itself inside a git repository, ask where the
  project should go instead.
- **description** (optional): one sentence on what the project is. Use it
  only if the user said it; otherwise leave it out (the template says §1
  writes it).
- **stack** (optional): only if the user already named one (for example
  "Python + FastAPI"). Without it, §1 decides.
- **Codex agents**: included by default. Pass `--no-codex` only if the user
  says so.

Don't ask about anything else. The conventions are fixed: local merges,
committed `review.md`, core kit only. If the user gave everything in the
request, ask nothing.

## 2. Run it

```bash
node "<this skill's folder>/scaffold.mjs" <name> [--parent <dir>] \
  [--description "<one sentence>"] [--stack "<stack>"] [--no-codex]
```

Other flags:
- `--owner "<name>"` overrides the owner, which defaults to `git config
  user.name`;
- `--dry-run` shows what would be filled;
- `--no-commit` skips the commit.

The script refuses if the folder already exists; never delete it to make
room. If `npm run verify` fails, the repo is left uncommitted. Report the
output; don't patch the template silently.

## 3. Report

Tell the user:
- the path and the commit hash;
- the test count from `verify`;
- the next step: start a **new** Claude Code session in the project folder
  (its skills only load there), then run `/intent --feature` for §1 (stack
  and skeleton).

## Keeping the template current

The template is a frozen copy. Port an improvement to the kit into
`template/` deliberately:
- keep the placeholders;
- run `node scaffold.mjs tmp-check --parent <a temp dir>` to prove the
  template still verifies, then delete that folder;
- bump `version` above.
