# IgnitionAI Skills

Codex skills maintained by IgnitionAI.

## Available Skills

### app-architect-brainstorm

Collaborative application architecture design through Socratic brainstorming.
This skill produces architecture specifications and diagrams only: domain models,
database diagrams, layered architecture blueprints, stack decision records,
API contracts, ADRs, Product Truth Contracts, and validation checklists.

### product-truth-gate

Defines and enforces an observable product-outcome contract before a feature,
application, integration, migration, or repair can be declared usable or done.
It distinguishes architecture and internal checks from a verified end-to-end
user journey, and supports same-scenario parity checks against a reference.

## Installation

```bash
python /path/to/install-skill-from-github.py --repo IgnitionAI/skills --path app-architect-brainstorm
python /path/to/install-skill-from-github.py --repo IgnitionAI/skills --path product-truth-gate
```

After installation, restart Codex to pick up the skill.
