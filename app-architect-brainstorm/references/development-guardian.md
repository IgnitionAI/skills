# Development Guardian Guide

## Table of Contents
1. [The Regression Problem](#the-problem)
2. [Guardian Workflow](#workflow)
3. [Feature Evolution Patterns](#patterns)
4. [Common Regression Scenarios](#scenarios)
5. [Review Checklist for Iterations](#review)

---

## The Regression Problem

### Why Regressions Happen

When an agent (or developer) adds Feature N+1 after Feature N, these shortcuts appear:

| Iteration | Temptation | Result |
|-----------|-----------|--------|
| 1 | Follow architecture | Clean layers, proper DI |
| 2 | "Just one quick db query in the handler" | Handler touches DB |
| 3 | "I'll add the logic here, it's faster" | Business logic in controller |
| 4 | "The entity doesn't need a method for this" | Anemic entity, logic in service |
| 5 | "Importing the ORM directly is simpler" | ORM leaked into domain |

By iteration 5, the architecture is destroyed. **No single change was catastrophic, but the accumulation is.**

### The Guardian Principle

> **Every code change must be provably architecture-compliant before it ships.**

Not "should be". Not "ideally". MUST.

---

## Guardian Workflow

### The 4-Step Loop (Every Feature)

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Plan                                               │
│  Define what files you'll create/modify in each layer       │
│  BEFORE writing code.                                       │
├─────────────────────────────────────────────────────────────┤
│  STEP 2: Implement (layer order)                            │
│  1. Domain entity (or modify existing)                      │
│  2. Repository interface (add method if needed)              │
│  3. Mapper (update for schema changes)                       │
│  4. Repository implementation                                │
│  5. Use case (with DI)                                       │
│  6. Handler (delegates to use case)                          │
├─────────────────────────────────────────────────────────────┤
│  STEP 3: Validate                                           │
│  Run: ./scripts/arch-guardian.sh                            │
│  All checks must pass.                                      │
├─────────────────────────────────────────────────────────────┤
│  STEP 4: Commit                                             │
│  Only commit after guardian passes.                         │
└─────────────────────────────────────────────────────────────┘
```

### Critical Rule: No Cross-Layer Shortcuts

**NEVER do this:**

```
Handler ──→ DB        (bypasses use case + domain)
Handler ──→ Domain    (bypasses application layer)
Use Case ──→ DB       (bypasses repository interface)
Domain ──→ ORM        (domain becomes infrastructure)
```

**ALWAYS do this:**

```
Handler ──→ Use Case ──→ Repository Interface ──→ Repository Impl ──→ DB
              │
              └──→ Domain Entity (business logic)
```

---

## Feature Evolution Patterns

### Pattern 1: Adding a New Field to an Existing Entity

**Example:** Add `costUsd` field to the `Run` entity.

```
1. domain/entities/run.ts
   └── Add costUsd to constructor + getter
   └── Add business method if needed (e.g., isWithinBudget())

2. domain/repositories/run-repository.ts
   └── (No change — interface doesn't care about fields)

3. infrastructure/persistence/schema.ts
   └── Add cost_usd column to run table

4. infrastructure/persistence/mappers/run-mapper.ts
   └── toDomain(): map cost_usd → costUsd
   └── toPersistence(): map costUsd → cost_usd

5. infrastructure/persistence/run-repository.ts
   └── (No change — queries don't change)

6. application/use-cases/*
   └── Update DTOs if field is exposed

7. interface/http/run-handler.ts
   └── Update response schema

8. VALIDATE: ./scripts/arch-guardian.sh
```

**Common regression:** Forgetting step 4 (mapper). The field exists in the schema and entity but is never transferred. Result: field is always null.

### Pattern 2: Adding a New Entity (Full Stack)

**Example:** Add `Alert` entity for notifications.

```
MUST create ALL of these files (no exceptions):

1. domain/entities/alert.ts                    ← Pure class with invariants
2. domain/repositories/alert-repository.ts     ← IAlertRepository interface
3. domain/events/alert-triggered.ts            ← Domain event (if needed)

4. infrastructure/persistence/schema.ts
   └── Add alert table
5. infrastructure/persistence/mappers/alert-mapper.ts
   └── AlertMapper.toDomain() / toPersistence()
6. infrastructure/persistence/alert-repository.ts
   └── AlertDrizzleRepository implements IAlertRepository

7. application/dto/alert-dto.ts
   └── CreateAlertRequest, AlertResponse
8. application/use-cases/create-alert.ts
   └── CreateAlertUseCase (6-step structure)

9. interface/http/alert-handler.ts
   └── Routes: POST, GET, PATCH

10. VALIDATE: ./scripts/arch-guardian.sh
```

**Common regression:** Creating the entity + handler but skipping the repository interface. Result: handler directly queries DB, architecture violated.

### Pattern 3: Adding a New Use Case for Existing Entity

**Example:** Add `CancelExperimentUseCase` for the existing `Experiment` entity.

```
1. domain/entities/experiment.ts
   └── Add cancel() method with invariant checks
   └── Example: throw if status !== 'running'

2. application/use-cases/cancel-experiment.ts
   └── Inject IExperimentRepository (existing)
   └── 6-step: fetch → cancel() → save → return DTO
   └── DO NOT add new repository methods unless needed

3. interface/http/experiment-handler.ts
   └── Add PATCH /:id/cancel route
   └── Delegate to CancelExperimentUseCase

4. VALIDATE: ./scripts/arch-guardian.sh
```

**Common regression:** Adding business logic in the use case instead of the entity. Result: duplicate logic across use cases, inconsistency.

### Pattern 4: Adding a Cross-Cutting Concern

**Example:** Add audit logging to all database writes.

```
CORRECT (Decorator Pattern):

1. Create AuditableRepository<T> that wraps any IRepository<T>
2. Wrap existing repositories at the composition root:

   const runRepo = new AuditableRepository(
     new RunDrizzleRepository(mapper),
     auditLogger
   );

3. The domain interface doesn't change
4. The use cases don't change

WRONG (every repository implements audit logic):
- Add audit to every repository implementation
- Result: duplicated code, some repos forget it
```

### Pattern 5: Changing Database Technology

**Example:** Switch from Drizzle to Prisma ORM.

```
FILES TO MODIFY:
✓ infrastructure/persistence/schema.ts           ← Replace Drizzle with Prisma
✓ infrastructure/persistence/mappers/*.ts        ← Update mapper internals
✓ infrastructure/persistence/*-repository.ts     ← Replace queries
✓ infrastructure/persistence/connection.ts       ← Replace connection

FILES THAT MUST NOT CHANGE:
✗ domain/entities/*.ts                           ← Pure, no ORM
✗ domain/repositories/*.ts                       ← Interfaces, no SQL
✗ application/use-cases/*.ts                     ← Uses interfaces
✗ interface/http/*.ts                            │ Delegates to use cases

If any domain/application/interface file changes,
the migration is architecturally broken.
```

### Pattern 6: Refactoring Business Logic

**Example:** Extract scoring algorithm from use case to domain service.

```
BEFORE (logic in use case — wrong):
  class ScoreExperimentUseCase {
    execute() {
      // 50 lines of scoring logic here
    }
  }

AFTER (logic in domain service — correct):
  class ScoringEngine {
    calculate(experiment: Experiment): Score[] {
      // 50 lines of scoring logic here
    }
  }

  class ScoreExperimentUseCase {
    constructor(
      private scoringEngine: ScoringEngine,  // Injected
      private experimentRepo: IExperimentRepository,
    ) {}

    execute() {
      const experiment = await this.experimentRepo.findById(id);
      const scores = this.scoringEngine.calculate(experiment);
      // ... save scores
    }
  }
```

**Rule:** If a method contains conditionals based on entity state, it belongs in the entity or a domain service. If it orchestrates multiple entities, it's a use case.

---

## Common Regression Scenarios

### Scenario 1: "The Use Case Grew Too Big"

**Symptom:** Use case file > 200 lines, contains validation + business logic + external calls.

**Detection:** `wc -l src/application/use-cases/*.ts`

**Fix:**
- Extract validation to `validators/` (interface layer)
- Extract business logic to domain entity method or domain service
- Extract external calls to infrastructure adapter
- Use case should be < 80 lines (6-step structure)

### Scenario 2: "The Handler Does Too Much"

**Symptom:** Handler contains business conditionals, database queries, or direct repository access.

**Detection:** `./scripts/arch-guardian.sh` flags `db\.query` in `src/interface/`

**Fix:**
- Move business conditionals to domain entity
- Move DB queries to repository implementation
- Handler should be < 40 lines (extract, validate, delegate, respond)

### Scenario 3: "The Entity Lost Its Behavior"

**Symptom:** Entity only has getters/setters. Business logic moved to "service" classes.

**Detection:** `grep -c "public.*:" src/domain/entities/*.ts` (high count = anemic)

**Fix:**
- Move business methods back into entity
- Replace setters with named business methods
- Enforce invariants in methods

### Scenario 4: "The Mapper Is Out of Sync"

**Symptom:** New field added to entity and schema, but always null in production.

**Detection:** Compare entity fields vs mapper methods

**Fix:**
- Add field to `toDomain()` mapping
- Add field to `toPersistence()` mapping
- Write a test that round-trips entity → DB → entity and asserts field equality

### Scenario 5: "Tests Require Real Database"

**Symptom:** Unit tests fail without PostgreSQL running.

**Detection:** `npm run test:unit` fails with connection error

**Fix:**
- Create `InMemory{Entity}Repository` implementing the domain interface
- Use in-memory repos in unit tests
- Keep integration tests for the real repository implementation

---

## Review Checklist for Iterations

When reviewing a code change (AI-generated or human), check these in order:

### Layer Purity
- [ ] No new ORM code in `domain/`
- [ ] No new HTTP code in `application/`
- [ ] No new DB queries in `interface/`
- [ ] No imports from `infrastructure/` in `domain/` or `application/`

### Structure Completeness
- [ ] New entity → has repository interface
- [ ] New entity → has mapper
- [ ] New entity → has repository implementation
- [ ] New use case → uses DI (not `new Repository()`)
- [ ] New handler → delegates to use case (no direct DB)

### Naming Consistency
- [ ] Repository interface: `I{Entity}Repository`
- [ ] Use case: `{Action}{Entity}UseCase`
- [ ] Mapper: `{Entity}Mapper`
- [ ] Handler: `{entity}-handler.ts`
- [ ] No new files at project root or in forbidden folders

### Testability
- [ ] Can unit test use cases with in-memory repositories?
- [ ] Are domain entity invariants tested without mocks?
- [ ] No test requires real database/HTTP/cache

### Automation
- [ ] `./scripts/arch-guardian.sh` passes
- [ ] All existing tests still pass
- [ ] No new warnings in guardian output

---

## Emergency Recovery

If the architecture has already regressed:

### Step 1: Identify Violations
Run `./scripts/arch-guardian.sh` and capture all failures.

### Step 2: Stop the Bleeding
Create a branch. Do NOT add new features until violations are fixed.

### Step 3: Fix in Order
1. Extract ORM code from domain → `infrastructure/persistence/`
2. Create missing repository interfaces
3. Create missing mappers
4. Move business logic from handlers/use cases → domain entities
5. Add DI where repositories are instantiated inline
6. Run guardian after each fix

### Step 4: Prevent Recurrence
- Add `./scripts/arch-guardian.sh` to pre-commit hook
- Add guardian to CI/CD pipeline
- Review this guide before starting next feature
