# Architecture principles

This file is the only place a principle's wording lives. Review pass 10
(`REVIEW-POLICY.md`) and the KonMari brief point here and don't restate it.
A new layer, boundary or exception is added here, with its reason, in the
change that needs it (principle 12).

Each principle says how it is checked:

- **Enforced**: a lint rule, a test or a check fails `npm run verify` or
  `npm run check:intent`.
- **Judged**: review pass 10 reads the plan's "Where this goes" section and
  the diff against it.

The stack is §1's decision, so principles 1 and 2 are placeholders until
then. §1 names the layers, says which import rules enforce them (a lint rule,
or a test that proves each rule fires), and narrows `BUDGETED` and
`BUDGET_EXCLUDE` in `scripts/size-budget-lib.mjs` (principle 8). Add, renumber
or drop principles as the project needs; reviews cite them by number.

## Layers and dependencies

1. **The core stays pure.** <§1: the folders holding the domain logic, and
   what they never import (frameworks, I/O, UI, model SDKs).> *Judged* until
   an import rule enforces it.
2. **Dependencies point one way.** <§1: the layers in order, for example
   `ui` → `app` → `domain`, never back up; skipping a layer downwards is
   allowed.> *Judged* until an import rule enforces it.

## Where logic lives

3. **Logic lives in the core.** Entry points, adapters and UI only wire
   things up and present. *Judged.*
4. **One source of truth.** A rule, a number or a prompt has one home, and
   anything showing it reads from there. *Judged.*
5. **No duplicated code.** New code reuses an existing helper rather than
   adding a copy; two pieces that compute the same thing from the same inputs
   become one. Code that merely looks alike but has a different reason to
   change stays apart. *Judged*, and the KonMari step tidies what slips
   through.

## Size and structure

6. **Modules have one clear job.** A new module's purpose fits in a
   sentence, and new work doesn't pile into a large file when it has a
   natural home elsewhere. *Judged.*
7. **Few dependencies.** A new dependency needs a reason, is pinned and goes
   in the plan. *Judged* (review pass 8).
8. **Size limits and the budget.** A hand-written source file over 500 lines
   can't grow beyond its ceiling in `scripts/size-baseline.json`, and a
   ceiling can't rise by more than 50 lines per intent, or at all without a
   `budget: <path> +<n>: <reason>` line in the plan's "Where this goes". A
   change that shrinks a budgeted file lowers its ceiling
   (`npm run size:baseline -- --write`). *Enforced* by `npm run check:intent`.
   The ceiling counts physical lines (`wc -l` style).

## Tests and traceability

9. **Logic is testable without I/O.** New logic goes in pure functions with
   tests; only wiring, I/O and presentation rely on end-to-end tests and the
   live check. *Judged.*
10. **Behaviour that matters is proven.** A behavioural line has a test that
    fails when it is mutated (review pass 4). *Judged.*
11. **Interpretations leave a trace.** A reading of an ambiguous requirement,
    or a deliberate departure from one, gets a code comment where it is
    implemented. *Judged.*
12. **Structural decisions are written down.** A new layer, a new boundary or
    an exception goes in this file with its reason. *Judged.*

## Recorded exceptions

| Exception | Principle | Reason |
| --- | --- | --- |
| (none yet) | | |
