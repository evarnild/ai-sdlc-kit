# How to make a change in {{NAME}}

This is the short version of the AI-native SDLC as it runs here. The detail
lives in [`intents/README.md`](intents/README.md) (types, gates, who edits
what), [`REVIEW-POLICY.md`](REVIEW-POLICY.md) (tiers, review passes) and
[`CLAUDE.md`](CLAUDE.md) → "Parallel sessions". If this file and those
disagree, they win.

Every change follows the same path, and its **type** decides how much of it
you do. Work from a Claude Code session started in the main checkout
(`{{PATH}}`). That session is the **coordinator**, and it is where
`CLAUDE.md`, the skills and the hooks load. The id is the next `§` number,
which `npm run queue -- --next-id` prints.

## The steps

**1. Intent: what you want and why**

- Run `/intent` and describe the problem in your own words.
- It creates `intents/<id>-<slug>/` with `intent.md` and `metadata.yml`, and
  proposes a type. When in doubt, the type is feature.
- Read it. If it's right, record `intent_accepted: <date>`, or ask Claude to
  record it ("accept §N's intent"). This is gate 1, and it is your decision.

**2. Spec (features only)**

- Run `/spec <id>`; `spec.md` says what will be built.
- You record `spec_accepted`.

**3. Plan: how it will be built**

- Run `/build-plan <id>`; `plan.md` lists the files, the tests and the steps.
- `plan_approved` is your decision; you or the agent you ask records it. No
  code before this gate: `check:intent` fails a change whose code came
  first.

**4. Build**, in one of two ways:

- **Directly:** the coordinator creates the branch
  `feat|fix|refactor|adjust|exp/<id>-<slug>` in a worktree, and the
  `{{NAME}}-implementer` agent works through the plan, tests first.
- **In parallel:** `npm run spawn -- <id>` creates a worktree at
  `../{{NAME}}-wt/<id>-<slug>` with a reserved port 5200+(id mod 100) and a
  `CLAUDE.local.md` brief. When the gate the type needs is recorded
  (`plan_approved`, or `intent_accepted` for an adjustment or experiment),
  `/spawn` also launches the implementer in the background there, and
  reports back with an offer of `/review`. Otherwise open `claude` in the
  worktree; that session implements. Keep it to about three at once.

Either way, the build ends with `npm run verify` green and
`status: in-review`.

**5. Review**

Run `/review` from the coordinator. It runs `npm run verify`,
`npm run check:intent` and the passes in `REVIEW-POLICY.md`, then writes
`review.md` with a verdict:

- **rework**: fix, then run `/review` again;
- **attest** or **escalate**: go to the KonMari step (5a), then to your
  diff read, the live check or the ship (step 6).

**5a. KonMari: tidy the change before the live check** (feature, fix and
refactor)

- Once a review reaches **attest** or **escalate**, `/konmari <id>` (which
  `/auto` runs for you) sends a fresh Opus agent, `{{NAME}}-konmari`, over the
  intent's own change. It removes duplication, inside the diff and with code
  the diff duplicates, takes out dead code, and makes names and patterns match
  their neighbours. Behaviour doesn't change, and it adds no dependency.
- It is not a review round and never a stop. The coordinator re-runs
  `npm run verify`, `check:intent`, and every mutant the review killed on a
  file the tidy-up changed; the reviewer reads only the tidy-up commits. If
  any of that fails the tidy-up is reverted (`outcome: discarded`) and the
  run goes on.
- The result is `intents/<id>-<slug>/konmari.md` and a `## KonMari check`
  section in `review.md`. Your diff read and the live check then cover the
  tidied code.
- `konmari: skip` in `metadata.yml` (your words in a comment) skips it for one
  intent. It is not a gate. `npm run deliver -- <id> --dry-run` reports `konmari:
  kept | discarded | nothing to tidy | skipped | not run`, and never blocks.

The report also says `live-check: owed` or `not-needed`. It is owed for
changes to the runtime paths `REVIEW-POLICY.md` → "Live checks" names, to
`.claude/settings.json`, and for anything else only a live run can show.
When owed, its `## Live check` section gives the steps. Run them yourself,
then record `live_checked: <date>`, or tell Claude you ran them and ask it
to record the date. If you find a defect, leave the date empty and send the
change back to rework. `check:intent` blocks the merge until the date is
there.

Commit `review.md` and the `live_checked:` date to the branch before the
merge: the merge check reads the branch from git and can't see uncommitted
files.

**6. Approve and merge (your gate)**

- **Automated tier** (only intents or docs touched): merge.
- **Attested tier** (`src/`, scripts, tests): read the report, then merge.
- **Reviewed tier** (this policy, the kit's checker, agents, skills,
  `.claude/settings.json`, and anything that handles prompts, user-facing
  output, credentials or personal data): read the report **and** the diff,
  then merge.

Merging goes in this order:
1. `git merge --no-ff` on `main`;
2. `npm run verify` on `main`;
3. set `merged:` and `status: done` in `metadata.yml`;
4. push, if the repository has a remote;
5. `npm run spawn -- <id> --remove`, if you used a worktree.

You can ask Claude to do the merge, the push or the removal, each only when
you ask for it, for that change, in the current conversation. `/deliver <id>`
does all of it in order and stops at the first step that fails
(`/deliver <id> --dry-run`, or "can §N ship?", only reports). If you ran the
live check, say so in the same message. Run it from the main checkout, on
`main`. It first checks that nothing but the review, the metadata and, for the
KonMari step, `konmari.md` and the commits it lists changed after the
reviewed commit, that `check:intent` passes, and that any owed
live check is recorded, and refuses if not
(`REVIEW-POLICY.md` → "Merging").

## Running the steps on their own: `/auto`

`/auto <id>` in the coordinator carries one accepted intent through steps 2
to 5 without a prompt between them, and ends at step 6's door:

- **Your message is a request to record one gate.** `/auto <id>` is your
  request to record that intent's `plan_approved` (as `by-agent`, with a
  comment naming it). `spec_accepted`, `live_checked` and `/deliver` stay yours.
- **A feature stops once, at the spec**, for your `spec_accepted`; a yes
  continues the run. A fix or refactor has no spec; an adjustment or
  experiment has no plan.
- **It builds and reviews.** It spawns the worktree, launches the
  implementer, runs `/review`, and re-runs the reviewer's commands and
  surviving mutants itself before it writes `review.md`. A finding marked
  "Needs rework:" (mechanical) goes back to the implementer; one marked
  "Needs decision:" stops the run. At most three review rounds, counting
  rounds after a failed live check.
- **It tidies before the stop.** An `attest` or `escalate` verdict first runs
  the KonMari step (5a) (feature, fix and refactor; not with `konmari: skip`),
  so you read, and live-check, the tidied code.
- **It stops** for your questions, a decision, an `escalate` verdict (you
  read the diff; your next `/auto <id>` goes on to the live check or the
  ship, with no new round), a spec or plan amendment, running out of rounds,
  a live check owed, a CRITICAL finding, a red it cannot trace, a mismatch
  in the re-check, a plan that exists unapproved, a blocked ship dry-run, an
  agent error, a worktree held by another session, or a
  fourth open session. Each stop writes `auto_round` and
  `auto_stopped` into `metadata.yml`, shows in `npm run sessions` and
  `npm run queue` as `auto · r<n> · <reason>`, and sends a push notification
  when the session has the tool.
- **It ends at "ready: `/deliver <id>`"**, after `npm run deliver -- <id>
  --dry-run` shows nothing in the way, and never ships. Closing the session
  pauses it; `/auto <id>` in a new one resumes from the recorded round.
- Reviews of auto runs say `run: auto`, and every third attested one is
  sampled (every fifth manual one).

## What each type requires

| Type | Use for | You record |
| --- | --- | --- |
| feature | new behaviour, a new integration, anything with a design question | intent, spec, plan |
| fix | a live defect; needs a test that fails first, and `follows_up: <id>` if an earlier § caused it | intent, plan |
| refactor | structure changes, behaviour held constant | intent, plan |
| adjustment | wording, README, config, constants: at most 5 files and 60 lines, no core code | intent only |
| experiment | throwaway probes; never merged into core code as-is | intent only |

## Along the way

- `npm run queue` lists every intent by status, generated from the
  `metadata.yml` files.
- `npm run sessions` shows every worktree: status, gates, ahead/behind
  `main`, uncommitted files, and whether its session is working, idle or
  needs you.
- `/grid` refreshes `docs/sdlc-grid.md`. Run it every few weeks.
- A defect you hit becomes a new **fix** intent. Triaging it is one of your
  gates too.
- Every fifth attested manual change, and every third attested auto-run
  change, gets a full diff read after merge (`sampled: yes` in its
  `review.md`).

To start: `/intent` plus what you want changed. The first one is §1, the
stack and skeleton.
