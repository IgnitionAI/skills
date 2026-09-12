# IgnitionAI Skills

Codex skills maintained by IgnitionAI.

## Available Skills

### app-architect-brainstorm

Collaborative application architecture design through Socratic brainstorming.
This skill produces architecture specifications and diagrams only: domain models,
database diagrams, layered architecture blueprints, stack decision records,
API contracts, ADRs, and validation checklists.

### web-3d-expert

Design, build, debug, and optimize interactive web 3D experiences with Three.js,
React Three Fiber, GLSL, and WebGPU/TSL. Includes practical references distilled
from the 21 WebGPU/TSL lessons of Bruno Simon's Three.js Journey, with source
attribution, production considerations, and an original browser validation lab.
Course transcripts, videos, and project assets are not included.

See [the skill](web-3d-expert/SKILL.md) and
[validation evidence](web-3d-expert/references/validation-evidence.md).

## Installation

```bash
python /path/to/install-skill-from-github.py --repo IgnitionAI/skills --path app-architect-brainstorm
```

To install the web 3D skill:

```bash
python /path/to/install-skill-from-github.py --repo IgnitionAI/skills --path web-3d-expert
```

After installation, restart Codex to pick up the skill.
