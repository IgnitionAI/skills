# docs/context/current-state.md — AS-IS / Ground-Truth Baseline

Last assessed: {DATE}
Assessed complexity: {COMPLEXITY_LEVEL} (Trivial | Feature | Architectural)
Mode: {MODE} (Mode A: Greenfield | Mode B: Reverse Engineering)

## What is true right now

### Product snapshot
- Archetype: {ARCHETYPE}
- Key user journeys / use cases: {SHORT_LIST}

### Ground truth sources (Mode B prioritizes evidence)
When working from an existing codebase, this skill must treat **source code and tests as truth**.

- Source code: {FILES_OR_MODULES_SUMMARY}
- Tests: {TEST_TYPES_AND_WHATTHEYPROVE}

## AS-IS architecture summary

### Observed structure (layers / components)
- Interface: {SUMMARY}
- Application: {SUMMARY}
- Domain: {SUMMARY}
- Infrastructure: {SUMMARY}

### Behavior & constraints
- Critical invariants (business rules): {INVARIANTS}
- Key data flows: {FLOW_SUMMARY}
- External integrations: {INTEGRATIONS}

## Risks, violations, and open questions (Mode B)
If the request is reverse engineering, summarize the most important findings:

- Critical violations / highest-risk coupling (summary)
- Migration risks and dependency traps
- Known gaps where tests do not cover behavior

## What we still do not know
- Assumptions that need confirmation
- Unverified edges / missing tests

