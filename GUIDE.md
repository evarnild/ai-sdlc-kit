# AI-native SDLC kit — user guide

This guide is for the person who owns a project built with the kit: the
human at the gates. It explains what the kit is, how a change moves from an
idea to `main`, what you decide at each step, and what the agents do on
your behalf.

Inside a project, three files hold the binding rules: `intents/README.md`,
`REVIEW-POLICY.md` and `CLAUDE.md`. If this guide and those files ever
disagree, the project files win.

---

## Contents

1. [The idea in one page](#1-the-idea-in-one-page)
2. [Install and create a project](#2-install-and-create-a-project)
3. [What's in a new project](#3-whats-in-a-new-project)
4. [Roles](#4-roles)
5. [The lifecycle, step by step](#5-the-lifecycle-step-by-step)
6. [Types: choosing the right path](#6-types-choosing-the-right-path)
7. [Gates and `metadata.yml`](#7-gates-and-metadatayml)
8. [`check:intent`: the type check](#8-checkintent-the-type-check)
9. [Review: tiers, passes, verdicts](#9-review-tiers-passes-verdicts)
10. [Live checks](#10-live-checks)
11. [Merging](#11-merging)
12. [The grid and the scan](#12-the-grid-and-the-scan)
13. [Your first intent: §1](#13-your-first-intent-1)
14. [A worked example](#14-a-worked-example)
15. [Everyday commands](#15-everyday-commands)
16. [FAQ and troubleshooting](#16-faq-and-troubleshooting)
17. [Glossary](#17-glossary)

---

## 1. The idea in one page

AI agents can write most of the code. What they can't do is decide **what
is worth building** or **take responsibility** for what ships. The kit
splits the work along that line:

- **Every change starts as an intent**, a short written statement of the
  problem and the outcome. Nothing is built without one.
- **Each stage leaves a file the next stage reads**:

  ```
  intent.md  →  spec.md  →  plan.md  →  code + tests  →  review.md  →  merge
  ```

  The chain is the audit trail: who asked for what, who approved it, and
  what was checked.
- **Humans sit at the gates.** You accept the intent, accept the spec,
  approve the plan, and approve the merge. Agents draft, build and review
  between the gates.
- **Effort matches risk.** A README typo takes the short path, and a change
  to how the product handles user data takes the long one. The **type** of
  a change and the **tier** of its review decide which.
- **Claims are checked, not trusted.** `npm run check:intent` verifies that
  the gates were passed before code arrived. The review re-runs everything
  itself and mutation-tests the changed lines.
- **Progress is measured.** `/grid` scores the project on six stages and
  five levels, and always reads throughput beside the revert rate.

There are no pull requests. Merges are local, and the review report is a
committed file. The kit is built for a solo owner or a small team working
with agents.

---

## 2. Install and create a project

### Requirements

- Node 22 or later, and git.
- Claude Code. Codex is optional; the kit ships agents for both.

### Install the skill (once)

```bash
git clone https://github.com/evarnild/ai-sdlc-kit ~/.claude/skills/new-sdlc-project
```

On Windows, use `%USERPROFILE%\.claude\skills\new-sdlc-project`. The folder
must be named `new-sdlc-project`.

### Create a project

In any Claude Code session:

```
/new-sdlc-project invoice-bot, Python + FastAPI, reads supplier invoices
```

Claude asks only for what's missing (usually just the name), then runs the
scaffold. You can also run it yourself:

```bash
node ~/.claude/skills/new-sdlc-project/scaffold.mjs invoice-bot \
  --parent ~/src \
  --description "Reads supplier invoices and drafts booking entries." \
  --stack "Python + FastAPI"
```

The scaffold:
- copies the kit;
- fills in the name, owner, date and path;
- runs `git init` on `main`;
- runs `npm run verify` (the kit's 58 tests);
- makes one commit.

It refuses to overwrite a folder that already exists.

| Flag | Meaning |
| --- | --- |
| `--parent <dir>` | where the project folder goes (default: the current directory) |
| `--description "..."` | one sentence for `README.md` and `CLAUDE.md` |
| `--stack "..."` | the intended stack; §1 confirms it |
| `--owner "..."` | name in the grid and skill metadata (default: `git config user.name`) |
| `--no-codex` | leave out `.codex/agents/` and `AGENTS.md` |
| `--no-commit` | stage the files but don't commit |
| `--dry-run` | show what would be filled in, and create nothing |

### Then

Open a **new Claude Code session in the project folder**. The project's
skills (`/intent`, `/review`, `/grid`) and agents only load there. Then
start §1 (see [section 13](#13-your-first-intent-1)).

---

## 3. What's in a new project

```
CLAUDE.md            context for agents: commands, how work flows, architecture
AGENTS.md            the same for Codex
sdlc.md              the one-page process for you
plan.md              coordinator view: snapshot, queue, backlog, shipped
REVIEW-POLICY.md     tiers, review passes, live checks, merge rules
intents/
  README.md          types, gates, who edits what
  _templates/        intent.md, spec.md, plan.md, metadata.yml
docs/sdlc-grid.md    where the project stands on the L0–L4 grid
scripts/             check-intent, sdlc-scan, and their tests (Node only)
.claude/skills/      /intent, /review, /grid
.claude/agents/      <name>-implementer, <name>-reviewer
.codex/agents/       the same agents for Codex
package.json         npm scripts: verify, check:intent, sdlc:scan, test:kit
```

The kit's scripts need no `npm install`. Your product's stack arrives with
§1, which extends `npm run verify` to build, lint and test it.

---

## 4. Roles

| Role | Who | Does | Never does |
| --- | --- | --- | --- |
| **Owner** | you | accepts intents and specs, approves plans, runs live checks, approves merges | — |
| **Coordinator** | the Claude Code session in the main checkout | edits `plan.md`, runs `/intent`, `/review`, `/grid`; merges when you ask | merges, pushes or records gates on its own initiative |
| **Implementer** | the `<name>-implementer` agent, in its own branch or worktree | builds an approved plan, tests first; appends to `## Progress`; sets `status: in-review` | edits the plan, records gates, touches `main`, pushes, merges |
| **Reviewer** | the `<name>-reviewer` agent, called by `/review` | runs the passes, read-only; reports findings | modifies files (only `/review` writes `review.md`) |

Two rules matter more than the rest:

1. **Never `git checkout` a branch in the main checkout.** It belongs to
   the coordinator, and another session may be working there.
   Implementation happens in worktrees.
2. **Agents act on outward or irreversible steps only when you ask, in the
   current conversation, for that change.** This covers merging, pushing,
   deleting a branch and removing a worktree. "Go ahead" in reply to a
   proposal counts. A standing instruction or a memory does not.

---

## 5. The lifecycle, step by step

```
 you               agents                         files
 ───               ──────                         ─────
 describe it  →    /intent drafts           →     intent.md, metadata.yml
 ACCEPT       ─────────────────────────────→     intent_accepted: <date>
                   spec drafted (features)  →     spec.md
 ACCEPT       ─────────────────────────────→     spec_accepted: <date>
                   plan drafted             →     plan.md
 APPROVE      ─────────────────────────────→     plan_approved: <date>
                   implementer builds       →     code, tests, ## Progress
                   /review                  →     review.md (verdict)
 LIVE CHECK   ─────────────────────────────→     live_checked: <date>  (if owed)
 MERGE        ─────────────────────────────→     merge commit, merged:, status: done
```

### Step 1: Intent

Run `/intent` and describe what you want in your own words. A flag sets the
type: `--feature`, `--fix`, `--refactor`, `--adjust` or `--exp`.

```
/intent --fix the bot replies in English when the invoice is in German
```

The skill:
- reads what already exists (`plan.md`, earlier intents, `docs/`, and the
  code for a fix);
- asks **at most one round** of questions;
- creates `intents/<id>-<slug>/intent.md` and `metadata.yml`;
- adds a row to `plan.md`'s queue.

Anything it filled in without being told is listed under **Assumptions I
made**. Read that list.

**Your gate:** if the problem statement is right and the work is worth
doing, record `intent_accepted: <date>`. See
[section 7](#7-gates-and-metadatayml) for how.

What a good intent looks like:
- the **Problem** states a problem, not a solution;
- someone other than you could check the **Outcome**;
- the **Constraints** name the data, cost and autonomy limits that apply;
- a fix has a **reproduction** and names **the test that will fail first**.

### Step 2: Spec (features only)

`spec.md` decides **what** gets built:
- the sources that apply;
- numbered behaviours (B1, B2, …);
- the interpretations of anything ambiguous;
- the **acceptance criteria**, each mapped to a test or a live check;
- the non-functional points (boundaries, data, model use, autonomy);
- what is out of scope.

Ask Claude to draft it ("draft the spec for §4"), then edit it until it's
right.

**Your gate:** `spec_accepted: <date>`.

### Step 3: Plan

`plan.md` decides **how** it will be built:
- the goal and the risks;
- **Verified against the codebase**: every file and symbol the plan relies
  on, re-read on current `main`;
- small ordered subtasks;
- the test contract;
- the validation steps.

**Your gate:** `plan_approved: <date>`. No code before this. `check:intent`
fails a change whose code came first.

If the plan turns out wrong mid-build, the implementer stops and reports.
You fix the plan and re-approve it; the build doesn't push through.

### Step 4: Build

Ask the coordinator to build it: "implement §4". It creates the branch
`<prefix>/<id>-<slug>` in a worktree and hands the approved plan to the
implementer agent. The implementer:

- writes tests first (for a fix: a test that fails before the fix);
- commits early and often;
- fakes or records model calls and external APIs in tests, never calling
  them live;
- appends a dated entry to `plan.md` → `## Progress` per phase;
- finishes with `npm run verify` green, `check:intent` not failing, and
  `status: in-review`.

### Step 5: Review

Run `/review` (optionally `/review <branch>`) from the coordinator. It:
- runs `npm run verify` and `npm run check:intent`;
- decides the **tier**;
- runs the **nine passes**;
- writes `intents/<id>-<slug>/review.md` with a **verdict** and a
  **live-check** line.

See [section 9](#9-review-tiers-passes-verdicts).

| Verdict | Means | You do |
| --- | --- | --- |
| `rework` | something must change | the implementer fixes it, then `/review` again (round 2, 3, …) |
| `attest` | no findings that need rework | read the report; merge if you agree |
| `escalate` | the tier is Reviewed | read the report **and the diff**, then merge |

### Step 6: Live check (when owed)

If the report says `live-check: owed`, its `## Live check` section tells you
exactly what to run and what you should see. Do it yourself, then record
`live_checked: <date>`. See [section 10](#10-live-checks).

### Step 7: Merge

Commit `review.md` (and the `live_checked:` date) to the branch. Then ask:
"merge §4". Before merging, the coordinator checks three things and refuses
if any fails:
- the review covers exactly what is being merged;
- `check:intent` passes;
- no live check is outstanding.

Then it:
1. merges with `--no-ff`;
2. runs `verify` on `main`;
3. sets `merged:` and `status: done`;
4. moves the row in `plan.md` to Shipped.

See [section 11](#11-merging).

---

## 6. Types: choosing the right path

| Type | Branch | Artefacts | Gates you record | Use for |
| --- | --- | --- | --- | --- |
| **feature** | `feat/<id>-<slug>` | intent, spec, plan | intent, spec, plan | new behaviour, a new integration, anything with a design question |
| **fix** | `fix/<id>-<slug>` | intent, plan | intent, plan | a live defect; it carries a test that fails first |
| **refactor** | `refactor/<id>-<slug>` | intent, plan | intent, plan | structure changes that hold behaviour constant |
| **adjustment** | `adjust/<id>-<slug>` | intent | intent | wording, README, config, constants: at most 5 files and 60 lines, no core code |
| **experiment** | `exp/<id>-<slug>` | intent | intent | throwaway probes such as a prompt trial or a model comparison; never merged into core code as-is |

**When in doubt, it's a feature.** The heavy path costs a little time; the
light path on the wrong change costs a defect.

Points to know:

- **Fixes link to their cause.** If an earlier intent introduced the
  defect, record `follows_up: <id>` in the fix's metadata. The scan uses it
  to count follow-ups per review tier, which shows whether reviews are
  catching enough. Set it only for a real cause.
- **Adjustments are kept honest.** If one grows past 5 files or 60 lines, or
  touches core code, `check:intent` reports a ROUTE. Re-declare it as a fix
  or a feature.
- **Refactors must not lose test lines.** Deleting lines from an existing
  test is a ROUTE: behaviour may have changed. A renamed test file triggers
  this too; say so in `review.md`.
- **Wrong after merge?** Revert and keep the original intent, or open a new
  forward-fix intent. Never rewrite a merged intent's folder.

---

## 7. Gates and `metadata.yml`

`metadata.yml` is a deliberately flat file. The kit parses it without a YAML
library.

```yaml
id: 4
slug: german-replies
type: fix
status: in-progress      # draft | accepted | in-progress | in-review | done | abandoned | deferred
title: Reply in the invoice's language
review_tier:             # empty = path table decides; set only to raise (attested | reviewed)
intent_accepted: 2026-10-20
spec_accepted:           # feature only
plan_approved: 2026-10-21
live_checked:            # only when review.md says live-check: owed
merged:
follows_up: 2
links:
  - intents/2-intake
```

### The gates

| Gate | Meaning |
| --- | --- |
| `intent_accepted` | the work is worth doing, and the problem statement is right |
| `spec_accepted` | this is what we will build |
| `plan_approved` | this is how; no code before this |
| `live_checked` | I ran it myself and saw what the review said I should |
| (merge) | I read the report (and the diff at the Reviewed tier) and take responsibility |

A gate counts **only when it holds a date** (`YYYY-MM-DD`). `yes`, `TBD`,
`~` and `approved` don't count.

### Who records a gate

**You do.** It's a one-line edit, and you can commit it with the rest.

You can also let an agent record it for you, under all of these
conditions:
- you ask, in the current conversation, for **that gate on that intent**.
  "Accept §4's intent" or "approve the plan for §4" both work, and so does
  "yes" in reply to a message that proposed recording that gate;
- the agent writes today's date and adds the comment
  `# recorded by agent on owner's request`;
- the commit subject says so, for example `§4: plan approved (recorded on
  the owner's request)`.

**`live_checked:` is always yours.** Its whole point is a check by someone
other than the model that wrote and reviewed the code.

Why so strict? A gate an agent records on autopilot drifts into a
formality. You end up approving things you haven't read, and later nobody
can tell which approvals were deliberate.

---

## 8. `check:intent`: the type check

```bash
npm run check:intent              # working tree vs. main (includes uncommitted and untracked files)
npm run check:intent -- <branch>  # a branch, read from git; works from any checkout
npm run check:intent -- --base <ref>
```

It verifies that:
- the branch name carries an intent id, and its prefix matches the declared
  type;
- `intents/<id>-*/` holds the artefacts the type needs;
- the gates the type needs hold dates **before code changed**;
- the change's **shape** fits its type (adjustment size, a fix carrying a
  test, a refactor not deleting test lines, core code changing with tests);
- a live check the review says is owed has been recorded;
- in branch mode, inside the branch's own checkout, `review.md` and
  `metadata.yml` have no uncommitted changes.

| Result | Exit | Meaning | What to do |
| --- | --- | --- | --- |
| **PASS** | 0 | all good | carry on |
| **ROUTE** | 2 | the declared type doesn't fit what arrived | re-declare the type (and add the missing artefacts), or explain in `review.md` why it's fine |
| **FAIL** | 1 | something blocks | fix what the error says |

What counts as **code**, **core code** and a **test** is defined at the top
of `scripts/intent-check-lib.mjs`:
- **test**: `*.test.*`, `*.spec.*`, `test_*.py`, `*_test.py`, `*_test.go`,
  and anything under `tests/`, `test/` or `__tests__/`;
- **code** (what the gates guard): anything outside `intents/` and `docs/`
  that isn't markdown or a test. A test written before the plan is approved
  is harmless; a config file is not;
- **core code**: `src/` by default. §1 narrows it to the modules whose
  mistakes cost most.

---

## 9. Review: tiers, passes, verdicts

### Tiers: how hard you look

| Tier | You do | Typical paths |
| --- | --- | --- |
| **Automated** | merge once `verify` and `check:intent` are green | `intents/**`, `docs/**`, README wording |
| **Attested** | read the report, not the diff | most of `src/`, tests, scripts, build config |
| **Reviewed** | read the report **and** the diff | the review policy itself, the kit's checker, agents, skills, hook settings, lint guardrails; anything that handles **model prompts, user-facing output sent without a human in between, credentials, or personal data** |

Three inputs decide the tier, in order:
1. **paths**: the highest tier any touched path asks for;
2. **the intent**: `review_tier:` can raise it;
3. **the report**: a CRITICAL or HIGH finding, or a relevant "Not checked"
   item, escalates it.

**Nothing lowers a tier automatically.** Only an edit to `REVIEW-POLICY.md`
can, and that edit is itself Reviewed-tier.

Attested is available only while the project has a meaningful test suite
run by `npm run verify`. Before §1 adds yours, any `src/` change is reviewed
as Reviewed.

**Approving means:** "I read what the checker did, I accept its scope
including the Not-checked list, and I take responsibility." That the AI
missed something is not a defence.

### The nine passes

| # | Pass | Asks |
| --- | --- | --- |
| 1 | Intent and plan match | does the diff do what the intent and plan say, and nothing more? |
| 2 | Type check | what does `check:intent` say? |
| 3 | Behaviour against the spec | is every acceptance criterion (or the fix's reproduction) met in code and tests? |
| 4 | **Mutation testing** | do the tests prove the behaviour, or only pass? |
| 5 | Conventions | do `CLAUDE.md`'s boundaries and conventions hold? |
| 6 | Numbers in prose | can every measurement in the docs be reproduced? |
| 7 | Documentation | do `README.md` and `CLAUDE.md` still describe what exists? |
| 8 | Guardrails and hygiene | lint, warning cap, dependencies justified, no secrets or user data committed, no unescaped input reaching a shell, SQL or HTML |
| 9 | Repository footguns | recurring bug classes specific to this project; this list grows from findings |

**Pass 4, mutation testing**, matters most. For every changed line of
behaviour, the reviewer:
1. breaks the line on purpose (`>` to `>=`, a condition deleted, an early
   return);
2. runs the full suite;
3. records the result. If a test fails, the mutant is **killed**, which is
   good. If everything stays green, the mutant **survived**: no test guards
   that line, and that's a HIGH finding.

Mutations come from the diff, one per changed line, not from a mental list
of what the feature should do. The reviewer restores each file from a
backup and ends with a clean `git status`.

### Findings and severities

- **CRITICAL**: leaks data or credentials, sends something wrong to a user,
  or loses data.
- **HIGH**: wrong behaviour, or behaviour the tests don't prove (a surviving
  mutant).
- **MEDIUM**: correct but fragile, or misleading docs.
- **LOW**: stale docs, or something minor.

Style preferences are **nits**, not findings. They go in one line at the
end, or are left out.

### The report

`review.md` starts with a machine-readable header:

```
verdict: attest | escalate | rework
tier: automated | attested | reviewed
reviewed-commit: <hash>
round: <n>
sampled: no
live-check: owed | not-needed
```

Then come the sections: Passes, Type check, Findings, Not checked, Live
check, and Verified myself vs. taken on trust.

**Read the "Not checked" section.** It lists what the review could not
assess: behaviour that needs a live model, an external API, mutants it
couldn't run. An empty Not-checked section is almost always wrong. This
list is also the backlog for improving the harness.

Each new round goes at the top of the same file. Earlier rounds move below
`# Round N (history)`.

### Against rubber-stamping

- **Sampling.** Every fifth attested change is marked `sampled: yes`. After
  the merge, you read its full diff. Anything you find that the review
  missed is a defect in the review: add a pass or a rule, or move the path
  to Reviewed.
- **Quality per tier.** The scan counts follow-up fixes and reverts per
  tier. If attested changes need follow-ups more often than reviewed ones,
  the tier boundary is in the wrong place.
- **Time-to-approve is not measured.** Fast approval is not the goal.

---

## 10. Live checks

Some behaviour only shows when the thing runs: model output on real input,
a third-party API, a UI, a hook. A **live check** means you run it yourself
and record that you did, before the merge.

The review sets `live-check: owed` when any of these holds:
1. the diff touches a runtime path the project lists (§1 names the entry
   points, UI and integration adapters);
2. the diff touches `.claude/settings.json`, whose hooks run in every
   session;
3. a "Not checked" item is behaviour only a live run can show.

The report's `## Live check` section then gives you:

```
- owed: rule 3 — reply language depends on the live model
- steps: make run → paste fixtures/invoice-de.txt into the console → send
- you should see: the reply is in German and names the supplier
```

Do the steps. If it works, set `live_checked: <date>` and commit it to the
branch. If it doesn't, leave the date empty and send the change back to
rework, or open a fix intent if the defect is out of scope.

**An agent's own run is evidence, never the gate.** The reviewer may run
the thing and report what it saw; that never fills `live_checked:`.
`check:intent` fails until the date is there.

---

## 11. Merging

Merges are local: there is no PR. You can merge yourself, or ask the
coordinator to: "merge §4". **Each request covers one change.**

Before merging, the coordinator checks the following, and refuses naming the
check that failed:

1. **The committed review covers what is being merged.**
   - The branch's committed `review.md` says `attest` or `escalate`.
   - Its `reviewed-commit` is an ancestor of the branch. A rebase since the
     review means a new round.
   - Nothing but that intent's `review.md` or `metadata.yml` changed since
     the reviewed commit.
2. `npm run check:intent <branch>` reports PASS, or ROUTE with the reason
   stated in `review.md`.
3. No live check is outstanding.

Then it:
1. merges with `git merge --no-ff`;
2. runs `npm run verify` on `main`;
3. sets `merged: <hash>` and `status: done`;
4. moves the row in `plan.md` to Shipped.

**Commit `review.md` and any `live_checked:` date to the branch first.** The
merge check reads the branch from git, so it can't see uncommitted files.

Pushing to a remote, and anything that releases or deploys, stays a separate
human gate.

---

## 12. The grid and the scan

`docs/sdlc-grid.md` scores the project on six stages:

| Stage | L1 · by hand | L2 · codified | L3 · triggered | L4 · closed loop |
| --- | --- | --- | --- | --- |
| Intent | intents written with an assistant, type declared, accepted | `/intent` produced it (stamped) | a report or monitor drafts the intent | intents drafted and ranked unattended |
| Design | `spec.md` by hand | a `/spec` skill | accepting an intent fires the spec | specs unattended; only concerns reach you |
| Build | context file; plan approved before code | shared agents; hooks block unsafe actions | a spec fires plan generation | approved plans built unattended where checks carry it |
| Test | one-command verify; failing test first; security check | protected tests; eval suites | a change fires verification | verification repairs itself within limits |
| Deploy | written review policy; agentic review on every change | tiers applied automatically; gates as hooks | a verified change fires review | everything up to release unattended |
| Maintain | findings written as fix intents | scheduled evals or soak runs | a failure fires diagnosis | findings written back as intents |

A level counts only when its trace exists:
- **L2 requires a stamp.** Files a skill produced start with
  `<!-- generated-by: <project>/<skill>@<version> -->`. Keep the stamp when
  you edit such a file.
- **L3 requires a trigger** (a hook or a schedule) with a run log.

Run `/grid` every few weeks, or at the start of each quarter. It:
- reads `npm run sdlc:scan` (agent-readiness, intents by type and status,
  stamps, verdicts, throughput, intent-reference rate, reverts, quality per
  tier);
- re-scores each stage;
- adds a dated row to the measures table;
- proposes **the two stages to move next**.

The rules it follows:
- never read throughput without the revert rate beside it;
- don't skip L1;
- don't automate a stage past the point where its output can be checked;
- if levels climb for two quarters while outcomes don't move, say so.

---

## 13. Your first intent: §1

A new project has no product code and an undecided (or tentative) stack.
§1 is the feature that sets the project up. Start it with:

```
/intent --feature choose the stack and build the project skeleton for <what it does>
```

By the time §1 merges, it should have:

1. **Picked the stack** and built a minimal skeleton that runs.
2. **Extended `npm run verify`** to build, lint and test the product, so
   there is still **one** command. Keep the kit's own tests in it.
3. **Added lint with a warning ratchet**, if you want guardrails such as
   file length, function length and complexity. Put the warnings under a
   cap (`--max-warnings N`, or your linter's equivalent) set at today's
   count. Lower the cap when warnings go away, and never raise it.
4. **Written `CLAUDE.md` → "Architecture"**: the modules, the boundary
   between pure tested logic and I/O, and the conventions worth knowing.
5. **Narrowed `CORE_CODE`** in `scripts/intent-check-lib.mjs` to the modules
   whose mistakes cost most.
6. **Named the live-check paths** in `REVIEW-POLICY.md` → "Live checks",
   rule 1: entry points, UI, integration adapters.
7. **Replaced the "by meaning" list** in the Reviewed tier with real paths:
   prompts, user-facing output, credential handling, personal data.

§1 changes the review policy and the checker, so it is a Reviewed-tier
change: read its diff.

---

## 14. A worked example

You notice the bot answers German invoices in English.

```
you   > /intent --fix the bot replies in English when the invoice is in German

claude  Created intents/4-reply-language/ (fix). The defect looks like it
        came from §2's prompt change, so I set follows_up: 2. The
        reproduction uses fixtures/invoice-de.txt, and the failing-first
        test is tests/test_reply.py::test_reply_matches_invoice_language.
        Assumptions: German only for now; other languages are out of scope.
        Next: accept the intent.

you   > accept §4's intent, and draft the plan

claude  Recorded intent_accepted: 2026-10-20 (on your request). Plan drafted
        in intents/4-reply-language/plan.md: 3 subtasks, the language
        detection in src/core/language.py, the prompt in
        src/prompts/reply.md. Note that the prompt path is Reviewed tier.

you   (read the plan, tweak a subtask)
you   > approve the plan for §4 and implement it

claude  Recorded plan_approved. Branch fix/4-reply-language in a worktree;
        the implementer wrote the failing test first (red), then the fix
        (green). verify green, check:intent PASS, status: in-review.

you   > /review

claude  verdict: escalate · tier: reviewed (src/prompts/** is Reviewed).
        0 findings. 4 of 4 mutants killed. Not checked: the live model's
        output. live-check: owed. Steps: make run → paste
        fixtures/invoice-de.txt → you should see a German reply naming the
        supplier.

you   (run it, see a German reply, set live_checked: 2026-10-21, commit)
you   (read the diff)
you   > merge §4

claude  Checks pass: review committed at the reviewed commit, check:intent
        PASS, live check recorded. Merged (a1b2c3d), verify green on main,
        metadata and plan.md updated.
```

---

## 15. Everyday commands

| Command | What it does |
| --- | --- |
| `/intent [--type] <text>` | draft an intent |
| `/review [branch]` | run the review policy and write `review.md` |
| `/grid` | refresh `docs/sdlc-grid.md` |
| `npm run verify` | the one check before a change is done |
| `npm run check:intent [-- <branch>]` | does this change match its intent? |
| `npm run sdlc:scan [-- --since YYYY-MM-DD] [--json]` | the evidence for the grid |
| `npm run test:kit` | the kit's own tests |

Phrases the coordinator understands as explicit requests:
- "accept §N's intent", "accept the spec for §N", "approve the plan for §N"
- "implement §N"
- "review §N", or `/review`
- "merge §N"
- "push" (when there is a remote)

---

## 16. FAQ and troubleshooting

**`check:intent` says the branch "carries no intent id".**
You're on `main` or on a branch without `<prefix>/<id>-<slug>`. That is
expected on `main`. Work happens on intent branches.

**FAIL: "Code changed before the gate was passed".**
A gate the type needs has no date, and code already moved. Record the gate
if you really approve, or move the code off the branch until you do.

**ROUTE on a refactor that only renamed a test file.**
A rename shows as lines deleted from the old path. Say so in `review.md`;
a ROUTE with a stated reason can merge.

**FAIL: "review.md or metadata.yml has changes not committed".**
The merge check reads git, not your disk. Commit the report and the date
to the branch, then re-run.

**`/review` says `rework`, but the only error is an owed live check.**
That one isn't rework: the live check is yours to clear. The review notes it
and carries on.

**The skills don't show up.**
Start Claude Code **in the project folder**. Project skills load from
`.claude/skills/` in the working directory.

**Can I skip the spec for a small feature?**
Make it an adjustment if it fits (at most 5 files and 60 lines, no core
code). Otherwise it's a feature, and the spec can be short. The gate is
about deciding, not about length.

**Can an agent merge or push for me automatically?**
No. Each merge, push, branch deletion or worktree removal needs your
explicit request, in the current conversation, for that change.

**How do I change the rules?**
Edit `REVIEW-POLICY.md`, `intents/README.md` or the skills through an
intent of their own. Those paths are Reviewed tier. If you change a rule in
`scripts/intent-check-lib.mjs`, change the matching text in
`intents/README.md` in the same commit.

**Where do the kit's improvements come from?**
The kit was first built for [heraklios](https://github.com/evarnild/heraklios).
New projects get a frozen copy of the template at scaffold time. Updating
the skill (`git pull` in `~/.claude/skills/new-sdlc-project`) changes only
projects created afterwards.

---

## 17. Glossary

- **Intent**: a written statement of a problem and the outcome wanted.
  The unit of work, with id `§N`.
- **Type**: feature, fix, refactor, adjustment or experiment. Decides the
  artefacts and gates.
- **Gate**: a human decision recorded as a date in `metadata.yml`.
- **Coordinator**: the Claude Code session in the main checkout. It owns
  `plan.md` and runs the skills.
- **Tier**: how much human reading a merge needs: Automated, Attested or
  Reviewed.
- **Verdict**: the review's conclusion: attest, escalate or rework.
- **ROUTE**: `check:intent`'s signal that the declared type doesn't fit
  the change.
- **Mutant, killed or survived**: a deliberately broken line, and whether
  the tests noticed.
- **Live check**: the owner running the change for real before the merge.
- **Stamp**: the `generated-by` line that marks a skill-produced file
  (evidence for L2).
- **Follow-up fix**: a fix intent whose `follows_up:` names the intent that
  caused the defect.
- **Core code**: the paths in `CORE_CODE` whose changes need tests and
  can't be adjustments.
