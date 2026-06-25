# Reverse Architecture: Analyzing Existing Codebases

## Table of Contents
1. [When to Use Reverse Mode](#when)
2. [The Reverse Process](#process)
3. [Discovery Phase](#discovery)
4. [Layer Identification](#layers)
5. [Violation Detection](#violations)
6. [Architecture Extraction](#extraction)
7. [Migration Planning](#migration)
8. [Output Deliverables](#output)

---

## When to Use Reverse Mode

Use reverse mode when the user provides an existing codebase (uploaded files, GitHub URL, or pasted structure) instead of starting from scratch.

**Signals:**
- "Voici mon projet, aide-moi à comprendre l'architecture"
- "J'ai un legacy, comment le refactoriser ?"
- "Mon codebase est devenu un plat de spaghetti"
- "Documente l'architecture de mon app"
- "Review mon projet et dis-moi ce qui va pas"
- "Je veux passer en Clean Architecture, par où commencer ?"
- "Analyse ce repo : [URL GitHub]"

---

## The Reverse Process

5 phases, always in this order:

```
Phase R1: Codebase Discovery     → Understand what exists (files, deps, patterns)
Phase R2: Architecture Mapping   → Map files to layers (or identify no layers)
Phase R3: Violation Detection    → Find anti-patterns, coupling, leaks
Phase R4: Architecture Blueprint → Produce diagrams of the AS-IS state
Phase R5: Migration Plan         → Roadmap to TO-BE Clean Architecture
```

---

## Phase R1: Codebase Discovery

### Step R1A: Structure Extraction

Analyze the project tree. Identify:

```
1. What files exist? (tree structure)
2. What dependencies? (package.json, requirements.txt, go.mod, Cargo.toml)
3. What framework? (Next.js, Express, Django, Laravel, etc.)
4. What ORM/database? (Prisma, Drizzle, TypeORM, SQLAlchemy, etc.)
5. What is the entry point? (main.ts, app.ts, server.ts, etc.)
6. What test structure? (test folders, test files, coverage)
```

### Step R1B: Ask the Context Questions

Even with an existing codebase, context matters:

1. **"How long has this codebase existed? Who wrote it?"**
2. **"What is the most painful part to modify?"** (reveals coupling hotspots)
3. **"What breaks most often when you deploy?"** (reveals fragility)
4. **"What would you want to change first if you could?"** (reveals priorities)
5. **"Is this used in production right now? By how many users?"** (reveals risk tolerance)
6. **"Do you have tests? Do they pass? How long do they take?"** (reveals testability)

### Step R1C: Import Map Analysis

The most revealing part. Build an import graph:

```
# TypeScript/JavaScript
grep -r "^import\|^from" src/ --include="*.ts" --include="*.js"

# Python
grep -r "^from\|^import" src/ --include="*.py"

# Go
grep -r '""' src/ --include="*.go"
```

What to look for:
- **Circular imports**: A imports B, B imports A → bad coupling
- **Deep imports**: `import { x } from '../../../../utils'` → no clear layering
- **Cross-domain imports**: Domain files importing infrastructure → leak
- **Everything imports everything**: High coupling, no separation

---

## Phase R2: Architecture Mapping

### Pattern A: Recognizable Layered Architecture

If the codebase follows a known pattern, map it:

```
src/
├── entities/ or models/     → MAYBE domain (check for ORM annotations)
├── services/                → LIKELY mixed business + DB logic
├── controllers/ or routes/  → Interface layer
├── repositories/            → Could be good (interfaces?) or bad (SQL everywhere)
├── middleware/              → Interface layer
└── utils/ or helpers/       → ??? (often a dumping ground)
```

### Pattern B: No Clear Architecture (Flat Structure)

```
src/
├── index.ts
├── auth.ts
├── database.ts
├── routes.ts
├── models.ts
├── utils.ts
└── config.ts
```

This is a **big ball of mud**. Every file depends on every other file.

### Pattern C: Framework-Driven Structure

```
# Next.js App Router
app/
├── api/
│   ├── auth/route.ts        ← Hashes passwords + DB queries + JWT
│   ├── users/route.ts       ← CRUD directly with Prisma
│   └── orders/route.ts      ← Business logic + DB + email mixed
├── page.tsx
└── layout.tsx
```

The framework dictates the structure. Business logic is wherever the route handler happens to be.

### The Layer Assignment Exercise

For each significant file, assign it to a Clean Architecture layer:

| File | Current Location | Clean Layer | Assessment |
|------|-----------------|-------------|------------|
| `models/user.ts` with `@Entity` | `src/models/` | `infrastructure/persistence/` | ORM model, not domain entity |
| `routes/auth.ts` with hashing logic | `app/api/auth/` | `interface/http/` + needs domain extraction | Business logic in handler |
| `utils/email.ts` | `src/utils/` | `infrastructure/external/` | External service adapter |
| `services/order-service.ts` | `src/services/` | Split: `domain/` + `application/` | Mixed concerns |

### Mapping Rules

| If the file contains... | It belongs in... |
|--------------------------|-------------------|
| HTTP request/response handling | `interface/http/` |
| Request validation (Zod, Joi) | `interface/validators/` |
| Auth middleware, rate limiting | `interface/middleware/` |
| Business workflow orchestration | `application/use-cases/` |
| Input/output DTOs | `application/dto/` |
| Business rules, invariants | `domain/entities/` |
| Repository interfaces | `domain/repositories/` |
| Domain events | `domain/events/` |
| DB queries, ORM code | `infrastructure/persistence/` |
| Entity↔DB mapping | `infrastructure/persistence/mappers/` |
| External API calls | `infrastructure/external/` |
| Cache logic | `infrastructure/cache/` |
| Email/SMS sending | `infrastructure/external/` |
| "Helper" functions used everywhere | Split: domain utils, application utils, or infrastructure |

---

## Phase R3: Violation Detection

### The 10 Most Common Violations in Existing Codebases

#### V1: ORM Models as Domain Entities

**Detection:** `grep -r "@Entity\|pgTable\|prisma\|@Column\|@Table" src/ --include="*.ts" | grep -v "infrastructure\|persistence"`

**What it looks like:**
```typescript
// src/models/user.ts  ← WRONG: should be in infrastructure
import { pgTable } from 'drizzle-orm/pg-core';
export const user = pgTable('user', { ... });

export function createUser(data) {
  // business logic here too!
  return db.insert(user).values(data);
}
```

**Severity:** CRITICAL
**Fix:** Extract pure entity to `domain/`, move ORM model to `infrastructure/persistence/`, create mapper.

#### V2: HTTP Framework in Business Logic

**Detection:** `grep -r "Response\|Request\|StatusCodes\|res\.json\|c\.json" src/services/ src/domain/ --include="*.ts" 2>/dev/null`

**What it looks like:**
```typescript
// src/services/order.ts  ← WRONG: HTTP in business logic
export async function createOrder(req: Request) {
  const { body } = req;  // HTTP concern!
  // ... business logic
  return new Response(JSON.stringify(result), { status: 201 });  // HTTP concern!
}
```

**Severity:** CRITICAL
**Fix:** Extract HTTP handling to `interface/http/`, business logic to `domain/` + `application/`.

#### V3: Direct Database Access Everywhere

**Detection:** `grep -r "prisma\.\|db\.query\|db\.select\|db\.insert\|createConnection\|Pool(" src/ --include="*.ts" | grep -v "infrastructure\|repository"`

**What it looks like:**
```typescript
// src/routes/orders.ts  ← WRONG: direct DB in handler
app.post('/orders', async (req, res) => {
  const order = await prisma.order.create({ data: req.body });
  res.json(order);
});
```

**Severity:** CRITICAL
**Fix:** Introduce repository interface in `domain/`, implementation in `infrastructure/`, inject into use case.

#### V4: God Service / God File

**Detection:** Files > 500 lines in `services/` or at root. Single file with 10+ exported functions.

**What it looks like:**
```typescript
// src/services/business.ts  ← 2000 lines, 40 functions
export function createOrder() { ... }
export function updateOrder() { ... }
export function cancelOrder() { ... }
export function processPayment() { ... }  // Wait, payment is a different concern!
export function sendEmail() { ... }       // And email too?
export function generateReport() { ... }  // And reporting?
// ... 35 more functions
```

**Severity:** HIGH
**Fix:** Split into one use case per file in `application/use-cases/`. Extract domain logic to entities.

#### V5: Missing Error Handling Strategy

**Detection:** `grep -r "catch\|try" src/ --include="*.ts" -l | wc -l` vs total files. Low ratio = missing error handling.

Also: `grep -r "console\.log\|console\.error" src/ --include="*.ts"` — console logging instead of structured logging.

**Severity:** HIGH
**Fix:** Define error taxonomy in `domain/`, implement error handler in `interface/middleware/`.

#### V6: No Repository Pattern

**Detection:** No `*Repository*` files exist. All DB access is inline.

**Severity:** CRITICAL
**Fix:** Create repository interfaces in `domain/repositories/`, implementations in `infrastructure/persistence/`.

#### V7: Anemic Domain Model

**Detection:** Entities are just data bags with getters/setters, no business methods.

```typescript
// src/models/order.ts  ← Anemic: no behavior
export interface Order {
  id: string;
  status: string;  // Just a string, not a type!
  total: number;
  // ... just fields, no methods
}
```

**Severity:** HIGH
**Fix:** Convert to class with private fields, business methods, invariants in constructor/factory.

#### V8: Circular Dependencies

**Detection:** Use `madge` (JS) or manual trace: A imports B, B imports C, C imports A.

**Severity:** HIGH
**Fix:** Identify the shared concern, extract to `domain/` or `application/ports/`.

#### V9: Configuration Hardcoded

**Detection:** `grep -r "http://localhost\|password\|secret\|api_key" src/ --include="*.ts" | grep -v "\.env"`

**Severity:** MEDIUM
**Fix:** Centralize config in `infrastructure/config/`, use environment variables.

#### V10: Mixed Auth Concerns

**Detection:** Auth logic (hashing, JWT, session) scattered across handlers, services, and utils.

**Severity:** MEDIUM
**Fix:** Extract auth to `infrastructure/auth/` or `domain/services/auth-service.ts`, create auth port in `application/ports/`.

### Violation Summary Template

Produce a summary table:

| # | Violation | Files Affected | Severity | Effort to Fix | Priority |
|---|-----------|---------------|----------|---------------|----------|
| 1 | ORM in domain | 5 files | CRITICAL | 2h | P0 |
| 2 | Direct DB access | 12 files | CRITICAL | 4h | P0 |
| 3 | God service | 1 file (800 lines) | HIGH | 3h | P1 |
| 4 | Anemic entities | 4 files | HIGH | 2h | P1 |
| ... | ... | ... | ... | ... | ... |

---

## Phase R4: Architecture Blueprint (AS-IS)

### Produce These Diagrams

1. **Current Folder Structure Diagram** — ASCII tree or Mermaid showing the actual layout
2. **Layer Assignment Diagram** — Mermaid showing which files map to which Clean Architecture layer
3. **Import Dependency Graph** — Mermaid showing the import relationships (simplified)
4. **Violation Heatmap** — Table or diagram showing where violations cluster

### AS-IS Architecture Document Template

```markdown
# Architecture Audit: {Project Name}

## 1. Project Overview
- **Language/Framework**: ...
- **Database**: ...
- **Lines of Code**: ...
- **Test Coverage**: ...%
- **Architecture Pattern**: {Layered | MVC | Big Ball of Mud | Framework-Driven}

## 2. Current Structure
```tree
{actual folder structure}
```

## 3. Layer Mapping
| File | Current Location | Assigned Clean Layer | Status |
|------|-----------------|---------------------|--------|
| ... | ... | ... | ✅ Correct / ⚠️ Misplaced / ❌ Violation |

## 4. Violations Found
{table from Phase R3}

## 5. Architecture Diagrams
### Current Layer Structure (Mermaid)
### Import Dependencies (Mermaid)
### Critical User Journey (Mermaid)

## 6. Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| "Cannot add feature X without breaking Y" | High | High | Extract domain logic |
| ... | ... | ... | ... |

## 7. Recommended Migration Priority
P0: {critical violations}
P1: {high severity}
P2: {medium, refactor opportunities}
```

---

## Phase R5: Migration Plan

### The Strangler Fig Pattern

Never rewrite everything at once. Migrate incrementally:

```
Week 1: Introduce domain entities (pure classes)
        → Extract business logic from existing services
        → Create value objects for critical types

Week 2: Introduce repository interfaces
        → Define I*Repository in domain/repositories/
        → Wrap existing DB calls in repository implementations
        → NO behavior change, just structure

Week 3: Introduce use cases
        → Create one use case per user story
        → Move orchestration from routes/controllers
        → Routes now only: extract, validate, delegate

Week 4: Introduce mappers
        → Separate ORM models from domain entities
        → Add mapper layer
        → Add in-memory repository implementations for tests

Week 5+: Add tests, refactor
        → Unit tests with in-memory repos
        → Integration tests with real DB
        → Fix remaining violations
```

### Migration Decision Framework

For each violation, decide:

| Violation | Fix Now | Fix Later | Leave As-Is |
|-----------|---------|-----------|-------------|
| ORM in domain | ✅ Always fix first | — | — |
| Direct DB access | ✅ If touching the code anyway | ✅ If stable | — |
| God service | ✅ Split when adding feature | ✅ Document intent | — |
| Anemic entities | ✅ When modifying entity | ✅ When adding invariant | — |
| Missing tests | — | ✅ Gradually | — Never |
| Hardcoded config | ✅ Quick win | — | — |

### The Golden Rule of Migration

> **"When you touch a file, leave it cleaner than you found it."**

Don't refactor files you don't need to modify. But when you do modify a file, apply Clean Architecture rules to it.

### Output: Migration Roadmap Document

```markdown
# Migration Roadmap: {Project Name}

## Current State Summary
{1-paragraph description of the AS-IS architecture}

## Target State
{description of the TO-BE Clean Architecture}

## Migration Phases

### Phase 1: Domain Foundation (Week 1-2)
- Extract {Entity1}, {Entity2} as pure domain classes
- Define invariants and business methods
- Create value objects for {Type1}, {Type2}

### Phase 2: Repository Abstraction (Week 2-3)
- Create I{Entity}Repository interfaces
- Wrap existing DB access in repository implementations
- Create in-memory repositories for testing

### Phase 3: Use Case Extraction (Week 3-4)
- Create use cases for: {List}
- Move orchestration from routes
- Add DTOs for request/response

### Phase 4: Interface Cleanup (Week 4-5)
- Remove business logic from handlers
- Centralize error handling
- Add validation middleware

### Phase 5: Testing & Hardening (Week 5-6)
- Unit tests with in-memory repos
- Integration tests
- Run guardian checks

## Quick Wins (can do immediately)
1. {quick win 1 — usually config or small extraction}
2. {quick win 2}

## Big Rocks (need dedicated time)
1. {big refactoring 1}
2. {big refactoring 2}
```

---

## Quick Reference: Analysis Commands

### TypeScript/JavaScript Projects

```bash
# Count files per directory
find src -type f -name "*.ts" | sed 's|src/||' | cut -d'/' -f1 | sort | uniq -c | sort -rn

# Find imports (cross-reference)
grep -r "^import.*from" src --include="*.ts" | grep -v "node_modules" | sort

# Find direct DB access outside repositories
grep -r "prisma\.\|db\." src --include="*.ts" -l | grep -v "repository\|infrastructure"

# Find HTTP in business logic
grep -r "Response\|Request\|res\.json\|c\.json" src/services src/domain src/models --include="*.ts" -l 2>/dev/null

# Find console.log (should be structured logging)
grep -r "console\." src --include="*.ts" -l | grep -v "node_modules"

# Count lines per file (find god files)
find src -name "*.ts" -exec wc -l {} + | sort -rn | head -20

# Detect circular dependencies
npx madge --circular src/
```

### Python Projects

```bash
# Import analysis
grep -r "^from\|^import" src --include="*.py" | grep -v "__pycache__" | sort

# Find SQL outside ORM models
grep -r "execute\|cursor\|INSERT\|SELECT\|UPDATE\|DELETE" src --include="*.py" -l | grep -v "repository\|models\|migration"

# Find HTTP in business logic
grep -r "request\|response\|jsonify\|HttpResponse" src/services src/domain --include="*.py" -l 2>/dev/null
```

### Go Projects

```bash
# Import analysis
grep -r '".*"' src --include="*.go" | grep -v "fmt\|strings\|time\|errors" | sort | uniq -c | sort -rn

# Find SQL outside repository
grep -r "Query\|Exec\|Prepare" src --include="*.go" -l | grep -v "repository\|infrastructure"
```
