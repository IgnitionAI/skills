---
name: product-truth-gate
description: >
  Define and enforce an observable product-outcome contract before declaring a
  feature, application, integration, migration, or repair usable or complete.
  Use when success depends on a real user journey or several runtime components,
  especially for existing repositories, local previews, deployments, imports,
  integrations, or comparisons with a reference product. Do not invoke for
  documentation-only work or isolated code changes that make no product claim.
---

# Product Truth Gate

Prevent plausible architecture, green internal tests, HTTP success, or a visible
shell from being mistaken for a working product. The gate evaluates the exact
outcome promised to the user, at the boundary where they experience it.

This skill does not replace architecture, implementation, QA, or security
review. It decides what evidence is allowed to support a product claim.

## Non-negotiable rule

Never claim `done`, `fixed`, `usable`, `live`, `ready`, or parity with another
product unless the required Product Truth Contract has passed end to end.

Lower-level evidence is useful but cannot substitute for higher-level evidence:

| Level | Evidence | What it proves |
|---|---|---|
| L0 | Architecture, specification, diagrams | The solution is reasoned about |
| L1 | Static checks and unit tests | Isolated rules behave as expected |
| L2 | Component and integration tests | Selected boundaries cooperate |
| L3 | Visible surface or successful response | A screen or endpoint can load |
| L4 | Critical user journey with its required runtime topology | The promised outcome works |
| L5 | Same-scenario comparison against a named reference | The stated parity claim is supported |

If the user's claim requires L4, L0-L3 remain `implemented_unverified` or
`partially_working`. A screenshot, `200`, health check, process PID, `live`
badge, or green unit suite is never L4 by itself.

## 1. Write the Product Truth Contract first

Before implementation or diagnosis, make the contract explicit. For an
architecture-only task, include it in the architecture package as a future
implementation gate; do not pretend to execute it.

Capture:

- **Actor and starting state**: who starts where, with what repository/data/auth.
- **Trigger**: the exact action the actor performs.
- **Observable outcome**: what must be visible or possible afterward.
- **Critical continuation**: the first meaningful action after initial render.
- **Required topology**: frontend, APIs, workers, databases, object stores,
  queues, third-party services, assets, auth, configuration, and ports that the
  journey actually needs.
- **Failure signals**: messages, blank assets, failed requests, broken reloads,
  missing data, dead controls, or degraded behavior that make the gate red.
- **Forbidden substitutes**: mocks, synthetic data, manual database edits,
  one-off commands, hidden configuration, skipped services, or product-specific
  patches that the intended workflow would not perform.
- **Evidence command**: one deterministic, agent-runnable test that can go red
  on the exact user-visible failure.
- **Reference scenario**: when parity is claimed, the identical input and
  journey to run on both products.

Use [references/truth-contract-template.md](references/truth-contract-template.md)
when producing or auditing a formal contract.

If a material field is unknown, ask or discover it. Do not silently weaken the
claim to match what is easy to test.

## 2. Reconstruct the real runtime topology

For an existing repository, derive topology from the repository and runtime,
not from the most convenient package:

1. Inspect root scripts, workspace manifests, compose files, environment
   schemas, service entry points, asset paths, API base URLs, workers, migrations,
   and readiness dependencies.
2. Map each step of the critical journey to the process and data it needs.
3. Mark services as required, optional, or external, with evidence.
4. Challenge any plan that starts only one component of a multi-service journey.

Starting the frontend alone is valid only when the contract explicitly asks for
a frontend-only artifact. Otherwise it is partial evidence, not product success.

## 3. Build a red-capable truth loop

Create the smallest deterministic loop that exercises the real boundary:

- Prefer a browser or API E2E that performs the user's action and asserts both
  the visible result and the critical continuation.
- Verify resource loading, API calls, authentication, persistence/reload, and
  required background work when they are part of the contract.
- Run it before the fix and record the red symptom.
- Keep it runnable without human interpretation. A human screenshot review may
  supplement the loop, but must not be its only assertion.

If the environment prevents the loop from running, report `blocked_unverified`.
Do not implement around the missing proof and later call the outcome complete.

## 4. Implement against the contract

Use lower-level tests to localize failures, but repeatedly return to the truth
loop. Every workaround must answer:

- Would a fresh user or fresh checkout receive this automatically?
- Does it preserve the intended security and architecture boundaries?
- Does it work after restart and reload?
- Does it support the next meaningful action, not just the first paint?
- Is this general behavior or an undeclared product-specific exception?

Manual state mutation may be useful for diagnosis. It is never completion
evidence unless manual operation is explicitly part of the product contract.

## 5. Run the adversarial completion review

Before reporting success, actively try to falsify it:

- Start from the user's actual initial state or a clean equivalent.
- Run the exact truth loop again.
- Inspect failed network requests and missing assets, not only DOM presence.
- Exercise the first meaningful control after load.
- Reload or restart when persistence/runtime recovery is part of normal use.
- For parity, run the same scenario against the reference and record meaningful
  differences rather than comparing feature lists.

Produce a claim-to-evidence table:

| Claim | Required level | Evidence | Result |
|---|---:|---|---|
| ... | L4 | exact command/artifact | pass/fail/blocked |

One failed required claim makes the product gate fail.

## 6. Use honest completion states

Report exactly one state:

- `architected`: specification exists; runtime outcome not implemented.
- `implemented_unverified`: code exists; truth loop did not run.
- `partially_working`: some required claims pass and at least one fails.
- `blocked_unverified`: the required proof cannot run in the current environment.
- `product_verified`: every required claim passes from the intended starting state.
- `parity_verified`: L5 same-scenario comparison passes the declared parity bar.

Lead with failed or blocked product claims even when internal checks are green.
Do not average architecture quality and runtime failure into a positive verdict.

## Pairing with app-architect-brainstorm

The pairing is deliberately asymmetric:

- `app-architect-brainstorm` discovers and writes the Product Truth Contract as
  part of the architecture package.
- `product-truth-gate` consumes that contract during implementation, repair,
  validation, and parity assessment.
- The architecture phase may declare `architected`, never `product_verified`.
- If implementation reveals missing topology or an invalid assumption, update
  the architecture contract rather than weakening the product truth gate.

The Product Truth Contract should influence component boundaries, local
developer experience, orchestration, observability, acceptance tests, and the
guardian checklist. It must remain outcome-focused rather than prescribing an
implementation prematurely.
