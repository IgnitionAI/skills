# Architecture Design Guide: generic-backend

## Purpose

This directory contains **architecture design patterns** for backend services following Clean Architecture. These are specification references — they guide the architecture document production, not code generation.

## Structure

```
generic-backend/
├── README.md              # Architecture design principles
└── src/
    ├── domain/
    │   ├── entities/
    │   │   ├── PATTERN.md          ← Universal entity design rules
    │   │   └── STRUCTURE-{lang}.md ← Language-specific structure guide
    │   ├── repositories/
    │   │   ├── PATTERN.md          ← Repository interface design rules
    │   │   └── STRUCTURE-{lang}.md ← Language-specific structure guide
    ├── application/
    │   └── use-cases/
    │       ├── PATTERN.md          ← Use case design rules
    │       └── STRUCTURE-{lang}.md ← Language-specific structure guide
    └── interface/
        └── http/
            ├── PATTERN.md          ← Handler design rules
            └── STRUCTURE-{lang}.md ← Language-specific structure guide
```

## How to Use

1. **Read PATTERN.md first** — universal design rules for the layer
2. **Read STRUCTURE-{lang}.md** — how the pattern maps to the selected language
3. **Produce architecture spec** — document entities, interfaces, use cases in the architecture document
4. **Do NOT produce source code** — implementation comes later, against the spec

## Available Languages

- `STRUCTURE-typescript.md` — TypeScript/NestJS/Hono patterns
- `STRUCTURE-python.md` — Python/FastAPI/Django patterns
- `STRUCTURE-go.md` — Go/Gin/Fiber patterns
- `STRUCTURE-rust.md` — Rust/Axum/Actix patterns
- `STRUCTURE-java.md` — Java/Spring Boot patterns
- `STRUCTURE-csharp.md` — C#/ASP.NET Core patterns

## What This Produces

The agent uses these guides to write the **architecture specification document**, which includes:
- Entity specifications (fields, invariants, methods, events)
- Repository interface specifications (method signatures)
- Use case specifications (input/output DTOs, step-by-step flow)
- Handler specifications (routes, validation, error mapping)

Not source code. Not configuration files. Not executable artifacts.
