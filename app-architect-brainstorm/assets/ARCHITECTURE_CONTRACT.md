# Architecture Contract

## Purpose

This document is a **machine-verifiable contract** that defines the architectural boundaries of the project. It is generated during Phase 5 and must be committed to version control alongside the code.

**Every subsequent feature development MUST validate against this contract before deployment.**

Think of it as: *"These are the rules. If you break them, the build fails."*

---

## How to Use This Contract

### During Development (Every Feature)

Before committing any code change, the agent MUST run:

```bash
# Check all architectural boundaries
./scripts/arch-guardian.sh
```

If the guardian reports failures, the code change is **architecturally invalid**. Fix the violations before committing.

### In CI/CD (Every Pull Request)

Add to `.github/workflows/ci.yml` (or equivalent):

```yaml
- name: Architecture Guardian
  run: ./scripts/arch-guardian.sh
```

If the guardian fails, the PR is blocked.

---

## Section 1: Forbidden Import Rules

These rules define which imports are forbidden from which directories. Violations are **critical** — they indicate layer boundary crossings.

### Rule: Domain Purity

```
FROM: src/domain/**
FORBIDDEN IMPORTS:
  - "*/infrastructure/*"
  - "*/interface/*"
  - "drizzle-orm"
  - "typeorm"
  - "prisma"
  - "@prisma/*"
  - "pg"
  - "mongodb"
  - "mongoose"
  - "hono"
  - "express"
  - "fastify"
  - "@fastify/*"
  - "koa"
  - "nestjs"
  - "@nestjs/*"
  - "zod"           # Validation is interface concern
  - "joi"
  - "yup"
  - "class-validator"
  - "ajv"
SEVERITY: CRITICAL
ERROR_MESSAGE: "Domain layer imports forbidden dependency. Domain must be pure."
```

### Rule: Application Isolation

```
FROM: src/application/**
FORBIDDEN IMPORTS:
  - "*/infrastructure/*"        # Must use DI via interfaces
  - "*/interface/*"             # Must not know about HTTP
  - "hono"
  - "express"
  - "fastify"
  - "koa"
  - "@nestjs/*"
  - "@hono/*"
SEVERITY: CRITICAL
ERROR_MESSAGE: "Application layer imports forbidden dependency. Use DI, not direct imports."
ALLOWED:
  - "*/domain/*"                # Application can use domain
  - "*/application/ports/*"     # Internal ports
```

### Rule: Interface Depends Only on Application

```
FROM: src/interface/**
FORBIDDEN IMPORTS:
  - "*/domain/*"                # Must go through use cases
  - "*/infrastructure/*"        # Must go through use cases
SEVERITY: CRITICAL
ERROR_MESSAGE: "Interface layer bypasses application layer. Use use cases."
ALLOWED:
  - "*/application/*"           # Interface uses application layer
  - "*/interface/*"             # Internal imports
```

### Rule: Infrastructure Implements Domain Interfaces

```
FROM: src/infrastructure/**
ALLOWED IMPORTS:
  - "*/domain/*"                # Implements domain interfaces
  - "*/application/ports/*"     # Implements application ports
  - "*/infrastructure/*"        # Internal imports
  - External libraries (ORM, HTTP clients, etc.)
FORBIDDEN IMPORTS:
  - "*/interface/*"             # Infrastructure knows nothing of HTTP
SEVERITY: WARNING
ERROR_MESSAGE: "Infrastructure imports from interface. Circular dependency risk."
```

---

## Section 2: Required Structure Rules

These rules ensure the folder structure remains correct. Files in wrong locations indicate architectural drift.

### Rule: Domain Entities Are Classes with Methods

```
CHECK: src/domain/entities/*.ts
MUST_CONTAIN_PATTERN: "class\s+\w+" OR "export\s+class\s+\w+"
MUST_NOT_CONTAIN:
  - "pgTable("              # Drizzle schema
  - "@Entity"               # TypeORM
  - "@Table("               # Sequelize
  - "@Schema("              # Mongoose
  - "prisma"                # Prisma
SEVERITY: CRITICAL
ERROR_MESSAGE: "Domain entity contains ORM code. Move ORM models to infrastructure/persistence/."
```

### Rule: Domain Repositories Are Interfaces

```
CHECK: src/domain/repositories/*.ts
MUST_CONTAIN_PATTERN: "interface\s+I\w+Repository" OR "abstract\s+class\s+\w+Repository"
MUST_NOT_CONTAIN:
  - "db\."                   # Direct DB access
  - "query("                # SQL queries
  - "select("               # ORM queries
  - "insert("               # ORM inserts
  - "PrismaClient"          # Prisma
  - "DataSource"            # TypeORM
SEVERITY: CRITICAL
ERROR_MESSAGE: "Domain repository is concrete or contains SQL. Must be interface only."
```

### Rule: Application Use Cases Exist

```
CHECK: src/application/use-cases/
MUST_EXIST: true
MIN_FILES: 1
SEVERITY: WARNING
ERROR_MESSAGE: "No use cases found. Application layer is empty."
```

### Rule: ORM Models Only in Infrastructure

```
CHECK: src/**/!infrastructure/**
MUST_NOT_CONTAIN:
  - "pgTable("              ANYWHERE outside infrastructure/persistence/
  - "@Entity"               ANYWHERE outside infrastructure/
  - "prisma"                ANYWHERE outside infrastructure/
SEVERITY: CRITICAL
ERROR_MESSAGE: "ORM model found outside infrastructure layer."
```

### Rule: Mappers Exist for Each Repository

```
CHECK: src/infrastructure/persistence/
FOR_EACH_FILE_MATCHING: "*repository*.ts"
MUST_HAVE_CORRESPONDING: "mappers/*-mapper.ts"
SEVERITY: WARNING
ERROR_MESSAGE: "Repository missing mapper. Create {name}-mapper.ts in mappers/."
```

---

## Section 3: Naming Conventions (Enforced)

Consistent naming makes violations detectable and code predictable.

| Location | Pattern | Example |
|----------|---------|---------|
| Domain entities | PascalCase noun | `Trace`, `Run`, `Experiment` |
| Domain repositories | `I{Entity}Repository` | `IRunRepository`, `IOrderRepository` |
| Domain events | `{Entity}{Action}Event` | `TraceReceivedEvent`, `OrderConfirmedEvent` |
| Domain value objects | `{Name}VO` | `RunStatusVO`, `EmailVO` |
| Use cases | `{Action}{Entity}UseCase` | `IngestTraceUseCase`, `CreateOrderUseCase` |
| Request DTOs | `{Action}{Entity}Request` | `IngestTraceRequest`, `CreateOrderRequest` |
| Response DTOs | `{Action}{Entity}Response` | `IngestTraceResponse`, `CreateOrderResponse` |
| Infra repositories | `{Entity}{Tech}Repository` | `RunDrizzleRepository`, `OrderPrismaRepository` |
| Mappers | `{Entity}Mapper` | `RunMapper`, `OrderMapper` |
| HTTP handlers | `{entity}-handler.ts` or `{entity}.routes.ts` | `trace-handler.ts`, `order.routes.ts` |
| Middleware | descriptive kebab-case | `workspace-middleware.ts`, `error-handler.ts` |

---

## Section 4: Anti-Regression Rules for Feature Development

When adding a new feature, these rules prevent architectural drift.

### Rule: New Entity → Full Layer Stack

When adding a **new domain entity**, the following files MUST be created:

```
IF src/domain/entities/{Entity}.ts is created:
  THEN ALL of the following MUST exist:
    ✓ src/domain/repositories/I{Entity}Repository.ts
    ✓ src/infrastructure/persistence/{entity}-repository.ts
    ✓ src/infrastructure/persistence/mappers/{entity}-mapper.ts
    ✓ src/infrastructure/persistence/schema.ts (updated with new table)
    ✓ src/application/use-cases/*{Entity}*UseCase.ts (at least one)
    ✓ src/interface/http/{entity}-handler.ts
```

**Incomplete implementation is a violation.** Creating an entity without a repository interface means the entity cannot be persisted correctly.

### Rule: New Use Case → No New Dependencies in Infrastructure

Adding a new use case MUST NOT require creating new infrastructure dependencies.

```
IF src/application/use-cases/{Action}{Entity}UseCase.ts uses:
  - I{Existing}Repository (✓ OK — existing interface)
  - I{New}Port (⚠️ Check — must have infrastructure implementation)
  - db.query() (❌ FORBIDDEN — use repository interface)
  - new {Something}Repository() (❌ FORBIDDEN — use DI)
```

### Rule: Handler Modification → No Business Logic Added

When modifying a handler, business logic must NOT be added:

```
CHECK: src/interface/http/*.ts
MUST_NOT_CONTAIN:
  - "if (score >"              # Business condition
  - "calculate("               # Business calculation
  - "canApprove"               # Business rule
  - "isEligible"               # Business rule
  - "db\."                     # Direct DB access
  - "new.*Repository"          # Repository instantiation
```

### Rule: Schema Change → Mapper Updated

When modifying the database schema, the corresponding mapper MUST be updated:

```
IF src/infrastructure/persistence/schema.ts changes:
  THEN grep -l "toDomain\|toPersistence" src/infrastructure/persistence/mappers/
  MUST have been modified in same commit (or explain why not)
```

---

## Section 5: Per-Stack Contract Overrides

This section is filled during Phase 5 based on the selected stack.

```yaml
# FILLED BY AGENT DURING PHASE 5
language: TypeScript
runtime: Bun
backend_framework: Hono
orm: Drizzle ORM
database: PostgreSQL
cache: Redis
queue: BullMQ
storage: S3-compatible
frontend_framework: Next.js

# Language-specific forbidden imports
additional_forbidden_from_domain:
  - "bun:sqlite"       # Use PostgreSQL via repository

# Framework-specific rules
additional_rules:
  - rule: "No Drizzle schema in domain"
    check: "src/domain/**/*.ts must not import from 'drizzle-orm'"
  - rule: "No Hono in application"
    check: "src/application/**/*.ts must not import from 'hono'"
```

---

## Section 6: Quick Reference for Agent

### Before Every Code Change

```
1. Read ARCHITECTURE_CONTRACT.md
2. Run: ./scripts/arch-guardian.sh
3. If failures → fix before proceeding
4. Make code changes
5. Run: ./scripts/arch-guardian.sh again
6. Only then commit
```

### When Adding a Feature

```
1. Domain first: Create/modify entity with invariants
2. Repository interface: Add method to domain interface if needed
3. Mapper: Update mapper for schema changes
4. Repository implementation: Implement new interface methods
5. Use case: Create with DI, 6-step structure
6. Handler: Wire to use case, no business logic
7. Test: In-memory repository unit test
8. Validate: Run arch-guardian.sh
```

### Common Regression Patterns to Watch

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| "Module not found" for domain import | File moved, import path broken | Update relative imports |
| `arch-guardian.sh` finds ORM in domain | Agent added `pgTable` to entity | Extract to infrastructure/schema.ts + create mapper |
| Handler has `if (score > 0.5)` | Business logic leaked to interface | Move condition to domain entity method |
| Use case creates `new Repository()` | Agent "forgot" DI | Add to constructor, wire in composition root |
| Test requires real PostgreSQL | No in-memory test double | Create `InMemory{Entity}Repository` for tests |
| Schema changed, test fails | Mapper not updated | Update `toDomain()` / `toPersistence()` in mapper |
