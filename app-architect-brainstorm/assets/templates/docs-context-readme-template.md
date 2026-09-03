# docs/context/README.md — {PROJECT_NAME}

Last updated: {DATE}

## Purpose
This folder stores persistent architecture knowledge produced by the `app-architect-brainstorm` skill.
It is designed to be selectively re-used by future agents to reduce documentation drift.

## Structure
```text
docs/context/
├── README.md                <-- This index
├── current-state.md        <-- AS-IS snapshot / ground-truth baseline
├── decisions/              <-- DECISIONS: ADRs, stack decision record, guardrails
└── plans/                  <-- PLANS: next steps (active) and completed work (archived)
    ├── active/
    └── archived/
```

## Quick Navigation
- AS-IS (baseline): `docs/context/current-state.md`
- DECISIONS:
  - `docs/context/decisions/stack-decision-record.md`
  - `docs/context/decisions/ADR-*.md`
  - `docs/context/decisions/ARCHITECTURE_CONTRACT.md`
- PLANS:
  - Active: `docs/context/plans/active/`
  - Archived: `docs/context/plans/archived/`

## How future agents should use this
1. Start with **AS-IS** to understand what we know is true today.
2. When implementing work that requires rationale changes, add a new ADR under **DECISIONS**.
3. When new work items are created, add/update a plan under **PLANS/active**.
4. Once work is completed (or an assumption is superseded), move it to **PLANS/archived** and keep the history.

