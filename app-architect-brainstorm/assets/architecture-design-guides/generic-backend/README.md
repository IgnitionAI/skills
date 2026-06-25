# Architecture Design Guide: Backend Service

## Purpose

This guide defines the Clean Architecture structure for a backend service. It documents the design patterns, layer responsibilities, and folder conventions that the architecture specification must follow.

This is a **reference document** — it guides the production of architecture specs, not the writing of source code.

## Design Principles

1. **Domain has zero external dependencies** — The domain layer contains only business logic. No ORM, no HTTP framework, no validation library.
2. **Dependencies point inward** — `interface/` → `application/` → `domain/` ← `infrastructure/`
3. **One use case per user story** — Each use case file represents exactly one business workflow.
4. **Repository interfaces in domain** — The domain defines what it needs. Infrastructure provides how.
5. **DTOs at boundaries** — Domain entities never leak past the application layer.

## Folder Structure (Design Specification)

```
src/
├── domain/                 # Business logic, zero external dependencies
│   ├── entities/           # Aggregate roots, entities, invariants
│   ├── value-objects/      # Validated types (Email, Money, etc.)
│   ├── repositories/       # Interfaces (ports) — implementations in infrastructure/
│   ├── events/             # Domain events
│   └── services/           # Domain services (multi-entity logic)
├── application/            # Orchestration layer
│   ├── use-cases/          # One per user story / workflow
│   ├── dto/                # Data transfer objects (input/output)
│   └── ports/              # Outgoing interfaces (email, payment, etc.)
├── infrastructure/         # Concrete implementations (adapters)
│   ├── persistence/        # Database repositories, ORM mappings, migrations
│   ├── cache/              # Redis/cache adapter
│   ├── external/           # Third-party API clients
│   └── http/               # Internal HTTP clients (if calling other services)
└── interface/              # Entry points (the only layer with framework code)
    ├── http/               # HTTP handlers, routes
    ├── middleware/         # Auth, logging, rate limiting, error handling
    └── validators/         # Request validation schemas
```

## Per-Language Structure Guides

The `src/` subdirectories contain design pattern guides for each layer, organized by programming language:

```
src/domain/entities/PATTERN.md           ← Universal entity design rules
src/domain/entities/STRUCTURE-{lang}.md  ← Language-specific structure

Available languages: typescript, python, go, rust, java, csharp
```

## Testing Strategy (Design Level)

| Test Type | Scope | Dependencies |
|-----------|-------|-------------|
| Unit | Domain entities, pure functions | None (in-memory) |
| Integration | Repository adapters | Dockerized DB/services |
| Contract | API request/response | Mock server |
| E2E | Full user flow | Full system in Docker |

## Layer Responsibilities

| Layer | Contents | Framework Dependency |
|-------|----------|---------------------|
| **Domain** | Entities, Value Objects, Repository Interfaces, Domain Events | Zero |
| **Application** | Use Cases, DTOs, Application Services | Zero |
| **Infrastructure** | DB Repositories, ORM Mappers, HTTP Clients, Caches | Full |
| **Interface** | Handlers, Middleware, Request Validators | Full |
