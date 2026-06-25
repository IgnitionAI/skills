# Pattern: Domain Entity — Design Specification

## Purpose
Define how domain entities are specified in the architecture document. Entities are the core of the domain layer — completely independent of frameworks, databases, and HTTP.

## Specification Rules
1. **Zero external dependencies** — No ORM, no HTTP, no JSON, no framework
2. **Invariants in constructor/factory** — All validation at creation time
3. **Factory methods** — `create()` (validates) and `reconstitute()` (from DB, trusts data)
4. **Business methods, not setters** — State changes via named methods that validate
5. **Value objects for complex types** — Email, Money, Status as separate validated types
6. **Domain events on significant changes** — Emit events when state changes matter
7. **Timestamps** — `createdAt` and `updatedAt` on all entities

## What to Specify in the Architecture Document

For each entity, document:

```
Entity: {Name}
├── Fields
│   ├── id: UUID (immutable)
│   ├── field1: Type (mutable via business methods only)
│   ├── field2: ValueObject
│   ├── createdAt: DateTime (immutable)
│   └── updatedAt: DateTime (updated on each change)
├── Factory Methods
│   ├── create(props): Entity — validates all invariants
│   └── reconstitute(id, ...): Entity — from persistence, skips validation
├── Business Methods
│   ├── {action}(): void — validates, changes state, may emit event
│   └── {query}(): Result — pure calculation, no side effects
├── Invariants (must always be true)
│   ├── "{condition}"
│   └── "{condition}"
└── Domain Events Emitted
    ├── {Entity}{Action}Event
    └── ...
```

## Anti-Patterns to Reject in Design Review

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| Anemic entity (data only) | Class has fields + getters/setters, no methods | Add business methods, encapsulate state changes |
| ORM annotations | `@Entity`, `pgTable()`, `@Column` in entity spec | Move to infrastructure/persistence schema |
| Public setters | `setName()`, `name = value` external | Replace with named business methods |
| Missing factory | Direct `new Entity()` everywhere | Add `create()` with validation |
| No invariants listed | "Just a data class" | Document 3-5 invariants that must always hold |

## Example: Run Entity Spec (for ML Evaluation SaaS)

```
Entity: Run (Aggregate Root)

Fields:
  - id: UUID (immutable)
  - projectId: UUID (immutable)
  - variantId: UUID (immutable)
  - datasetItemId: UUID | null (immutable)
  - experimentId: UUID | null (immutable)
  - status: RunStatus (pending → running → scored | failed)
  - traceId: UUID | null (set once)
  - traceStorageKey: string | null (S3 path, set with traceId)
  - traceSummary: JSON | null (derived from trace)
  - createdAt: DateTime (immutable)
  - updatedAt: DateTime

Factory Methods:
  - create(projectId, variantId, datasetItemId?, experimentId?): Run
    INVARIANT: projectId and variantId are required
  - reconstitute(id, ..., createdAt, updatedAt): Run
    (used by repository mapper — no validation)

Business Methods:
  - attachTrace(trace: Trace, storageKey: string): void
    INVARIANT: traceId must be null (trace not already attached)
    SIDE EFFECT: emits TraceReceivedEvent
  
  - transitionTo(newStatus: RunStatus): void
    INVARIANT: transition must be valid (pending→running→scored|failed)
    INVARIANT: cannot transition from scored or failed
    
  - tokenCount(): { input: number, output: number }
    (pure calculation from trace steps)

Invariants:
  1. A Run must belong to exactly one Project
  2. status can only progress forward (pending → running → scored|failed)
  3. Once a trace is attached, it cannot be changed
  4. A Run must have at least one of: datasetItemId or experimentId context

Domain Events:
  - TraceReceivedEvent (when trace attached)
  - RunScoredEvent (when scoring completes)
```

## Read Next

Select the language design guide for implementation structure:
- `IMPL-typescript.md` — TypeScript class structure guide
- `IMPL-python.md` — Python dataclass/struct guide
- `IMPL-go.md` — Go struct with methods guide
- `IMPL-rust.md` — Rust struct with impl guide
- `IMPL-java.md` — Java class structure guide
- `IMPL-csharp.md` — C# class/record structure guide

Note: These guides show the structural pattern for the chosen language. They are design references, not copy-paste code templates.
