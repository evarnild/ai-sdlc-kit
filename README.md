# ai-sdlc-kit

A Claude Code skill, `/new-sdlc-project`, that starts a new repository
already set up with an AI-native SDLC. Every change goes from an intent,
through spec and plan, to an agentic review and a human-approved merge. The
gates are recorded in files and enforced by a script.

**Read the [user guide](GUIDE.md)** for the whole process: roles, gates,
review tiers, mutation testing, live checks, merging, and a worked example.

The kit was first built for and battle-tested on
[heraklios](https://github.com/evarnild/heraklios), then made
stack-agnostic.

## What a new project gets

| Piece | What it does |
| --- | --- |
| `intents/` + templates | one folder per piece of work: `intent.md`, `spec.md`, `plan.md`, `review.md`, `metadata.yml` |
| five types | feature, fix, refactor, adjustment, experiment; each type decides which artefacts and gates apply |
| gates | `intent_accepted`, `spec_accepted`, `plan_approved`, `live_checked`, recorded as dates by the human |
| `npm run check:intent` | fails a branch whose code arrived before its gates; routes a change whose shape doesn't fit its declared type |
| `REVIEW-POLICY.md` | three review tiers (Automated, Attested, Reviewed), nine review passes including mutation testing, live checks, merge preconditions |
| `/intent`, `/review`, `/grid` | Claude Code skills that draft intents, run the review policy, and score the project on an L0–L4 grid |
| implementer and reviewer agents | for Claude Code (`.claude/agents/`) and Codex (`.codex/agents/`) |
| `npm run sdlc:scan` | the evidence behind the grid: intents, stamps, verdicts, throughput beside revert rate |
| `sdlc.md` | the step-by-step version for the human |

The kit itself needs only **Node 22 or later** and **git**: no `npm install`,
and its 58 tests run on `node:test`. The product's stack is the first
intent's decision (§1), so the kit works for Python, TypeScript, Go or
anything else.

Merges are local by design (no PR ceremony). The review report is a
committed `review.md`.

## Install

```bash
git clone https://github.com/evarnild/ai-sdlc-kit ~/.claude/skills/new-sdlc-project
```

On Windows, the target is `%USERPROFILE%\.claude\skills\new-sdlc-project`.
The folder name must be `new-sdlc-project`, the skill's name.

## Use

In Claude Code:

```
/new-sdlc-project invoice-bot, Python + FastAPI, reads supplier invoices
```

Or run the script directly:

```bash
node ~/.claude/skills/new-sdlc-project/scaffold.mjs invoice-bot \
  --parent ~/src --description "Reads supplier invoices." --stack "Python + FastAPI"
```

| Flag | Default |
| --- | --- |
| `--parent <dir>` | the current directory |
| `--description "..."` | a placeholder that §1 replaces |
| `--stack "..."` | undecided; §1 chooses |
| `--owner "..."` | `git config user.name` |
| `--no-codex` | Codex agents and `AGENTS.md` included |
| `--no-commit` | one scaffold commit made |
| `--dry-run` | — |

Then open Claude Code **in the new folder** (its skills load there) and run
`/intent --feature` for §1, choosing the stack and building the skeleton.

## License

MIT
