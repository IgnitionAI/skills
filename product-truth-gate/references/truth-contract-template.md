# Product Truth Contract Template

Use this template when the work makes a user-visible completion, usability, or
parity claim. Keep one contract per critical journey.

## Contract

| Field | Decision |
|---|---|
| Contract ID | `PTC-xxx` |
| Product claim | The exact sentence that may be said only if this gate passes |
| Required proof level | L4 product outcome or L5 parity |
| Actor | User/role/machine performing the journey |
| Starting state | Repository, data, auth, environment, and prior configuration |
| Trigger | Exact action or request |
| Observable outcome | User-visible or consumer-visible result |
| Critical continuation | First meaningful action after initial success |
| Required topology | Processes, stores, workers, external systems, assets, auth |
| Failure signals | Exact conditions that fail the gate |
| Forbidden substitutes | Mocks, manual steps, hidden setup, skipped dependencies |
| Evidence command | Deterministic command or test path |
| Evidence artifacts | Screenshot, trace, logs, hashes, report, or recording |
| Reference product | Required only for parity claims |
| Parity bar | Material behaviors that must match; allowed differences |

## Journey traceability

| Journey step | Required component/data | Observable assertion | Failure diagnostic |
|---|---|---|---|
| 1. ... | ... | ... | ... |

## Acceptance report

| Claim | Required level | Evidence | Result |
|---|---:|---|---|
| ... | L4 | `command`, artifact path, or trace ID | pass/fail/blocked |

Final state: `architected | implemented_unverified | partially_working | blocked_unverified | product_verified | parity_verified`

## Architecture-package use

During architecture work, fill the contract and map every required topology
item to a component, interface, operational responsibility, and planned E2E
proof. Mark the final state `architected`. Execution belongs to implementation
and validation work.

## Fast falsification questions

- Does this still work from a fresh checkout or intended first-run state?
- What happens after the first screen or successful response?
- Which backend, worker, store, or external service makes that action real?
- Do absolute asset and API paths resolve through the intended runtime boundary?
- Does reload/restart preserve the journey when users reasonably expect it?
- Which manual step would a real user not know to perform?
- Could the same evidence pass while the user's actual goal still fails?
