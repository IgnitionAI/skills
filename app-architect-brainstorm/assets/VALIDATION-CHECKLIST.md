# Validation Checklist — Phase 5 Anti-Cheat

## Purpose
This checklist prevents the agent from generating "pragmatic" code that bypasses Clean Architecture. Run every item before declaring Phase 5 complete.

**Rule: If ANY item fails, rewrite the offending files. No exceptions.**

---

## Section A: Folder Structure Compliance

Verify the generated folders match the required architecture exactly:

```
src/
├── domain/
│   ├── entities/         ✓ Must exist
│   ├── value-objects/    ✓ Must exist
│   ├── repositories/     ✓ Must exist (interfaces only)
│   ├── events/           ✓ Must exist
│   └── services/         ✓ Must exist
├── application/
│   ├── use-cases/        ✓ Must exist
│   ├── dto/              ✓ Must exist
│   └── ports/            ✓ Must exist
├── infrastructure/
│   ├── persistence/      ✓ Must exist (implementations + mappers + migrations)
│   ├── cache/            ✓ Must exist (if cache selected)
│   ├── external/         ✓ Must exist (if external APIs)
│   └── http/             ✓ Must exist (if internal HTTP clients)
└── interface/
    ├── http/             ✓ Must exist
    ├── middleware/       ✓ Must exist
    └── validators/       ✓ Must exist
```

### A.1 Forbidden Folders — If these exist, DELETE them

| Forbidden Path | Why It's Wrong | Where It Should Go |
|---------------|---------------|-------------------|
| `src/modules/` | Horizontal modules destroy layer isolation | Use `interface/http/routes.ts` per context |
| `src/services/` | "Services" mix business logic + DB + HTTP | Split: domain entities + application use cases |
| `src/models/` | ORM models leak domain concerns | `infrastructure/persistence/` only |
| `src/controllers/` at root | Controllers must be in `interface/http/` | Move to `src/interface/http/` |
| `src/db/` | DB code must be in infrastructure | Move to `src/infrastructure/persistence/` |
| `src/routes/` | Routes must be with handlers in `interface/` | Move to `src/interface/http/` |

---

## Section B: Domain Layer Purity

### B.1 Zero Framework Dependencies in Domain

Run this check in the generated code:

```bash
# The domain directory must NOT import from any framework
# Check these imports are ABSENT from src/domain/:

# TypeScript / Node:
# ❌ import { Entity } from 'typeorm'
# ❌ import { pgTable } from 'drizzle-orm/pg-core'
# ❌ import { Hono } from 'hono'
# ❌ import { Request } from 'express'
# ❌ import { z } from 'zod'
# ❌ import { ObjectId } from 'mongodb'
# ❌ Any ORM, HTTP framework, validation library, or external package

# Python:
# ❌ from sqlalchemy import Column, String
# ❌ from fastapi import HTTPException
# ❌ from pydantic import BaseModel
# ❌ from django.db import models

# Go:
# ❌ import "github.com/gin-gonic/gin"
# ❌ import "gorm.io/gorm"
# ❌ import "github.com/jackc/pgx"
```

**Only standard library + domain-level packages allowed.**

### B.2 Entities Have Behavior, Not Just Data

For every entity in `src/domain/entities/`:

| Check | Example of PASS | Example of FAIL |
|-------|----------------|-----------------|
| Has private/protected fields | `private _status: string` | `status: string` (public field) |
| Has factory method | `static create(props): Entity` | Direct `new Entity()` everywhere |
| Validates invariants | `if (name.length < 2) throw` | No validation |
| Has business methods | `order.confirm()` changes state | `order.status = 'confirmed'` (setter) |
| Has getters only for reads | `get status(): string` | Public fields readable everywhere |

**FAIL example (anemic entity — DELETE and rewrite):**
```typescript
// ❌ WRONG — Anemic entity, just data
export class Order {
  id: string;
  status: string;
  total: number;
  // ... just fields, no methods
}

// ✅ CORRECT — Rich entity with behavior
export class Order {
  private constructor(
    private readonly _id: string,
    private _status: OrderStatus,
    private _total: Money,
  ) {}

  static create(items: OrderItem[]): Order {
    if (items.length === 0) throw new EmptyOrderError();
    return new Order(crypto.randomUUID(), 'pending', Money.zero());
  }

  confirm(): void {
    if (this._status !== 'pending') throw new InvalidStateError();
    this._status = 'confirmed';
  }

  get id(): string { return this._id; }
  get status(): string { return this._status; }
}
```

### B.3 Repository Interfaces Are Actually Interfaces

| Check | Pass | Fail |
|-------|------|------|
| File is `interface` / `trait` / `Protocol` / ABC | `export interface IUserRepository` | `export class UserRepository` (concrete class) |
| Contains no SQL/queries | `findById(id): Promise<User\|null>` | `query('SELECT * FROM users...')` |
| Returns domain entities | `Promise<User\|null>` | `Promise<UserSchema\|null>` |
| Accepts domain entities | `save(user: User)` | `save(user: UserInsert)` |

---

## Section C: Application Layer Isolation

### C.1 Use Cases Follow the 6-Step Structure

Every use case file MUST follow this exact structure:

```typescript
class {Action}{Entity}UseCase {
  // 1. Constructor with injected interfaces
  constructor(private repo: IEntityRepository, ...) {}

  async execute(dto: RequestDTO): Promise<ResponseDTO> {
    // 2. Fetch entities (fail fast with specific errors)
    const entity = await this.repo.findById(dto.id);
    if (!entity) throw new EntityNotFoundError(dto.id);

    // 3. Call domain methods (decisions are in the domain)
    entity.doBusinessThing(dto.param);

    // 4. Save
    await this.repo.save(entity);

    // 5. Publish events (if applicable)
    for (const event of entity.pullEvents()) {
      await this.eventBus.publish(event);
    }

    // 6. Return DTO
    return { id: entity.id, ... };
  }
}
```

### C.2 Application Has Zero HTTP

Verify `src/application/` contains NO imports from:
- HTTP frameworks (Hono, Express, Fastify, Axum, Spring, ASP.NET)
- Request/Response types
- Status codes
- Session/cookie handling
- Header parsing

All HTTP concerns live in `src/interface/` only.

### C.3 Use Cases Never Instantiate Repositories

**FAIL (rewrite required):**
```typescript
async execute(dto) {
  const repo = new UserDrizzleRepository(this.db);  // ❌ Instantiated!
  const user = await repo.findById(dto.userId);
}
```

**PASS:**
```typescript
export class CreateOrderUseCase {
  constructor(
    private userRepo: IUserRepository,  // ✓ Injected in constructor
    private orderRepo: IOrderRepository, // ✓ Injected in constructor
  ) {}

  async execute(dto) {
    const user = await this.userRepo.findById(dto.userId); // ✓ Uses injected
  }
}
```

---

## Section D: Infrastructure Is Properly Isolated

### D.1 ORM Models Only in Infrastructure

Check that ALL ORM/DB models are in `src/infrastructure/persistence/` and NOWHERE else.

```
✓ src/infrastructure/persistence/schema.ts        (Drizzle schema)
✓ src/infrastructure/persistence/user-repository.ts (Implementation)
✓ src/infrastructure/persistence/mappers/user-mapper.ts (Entity ↔ DB conversion)

❌ src/domain/entities/user.ts  ← Contains @Entity, @Column
❌ src/models/user.ts           ← Contains pgTable definitions
❌ src/db/schema.ts             ← Drizzle schema at project root
```

### D.2 Every Repository Implementation Has a Mapper

For every repository in `infrastructure/persistence/`, verify:

```typescript
export class UserDrizzleRepository implements IUserRepository {
  constructor(
    private db: DrizzleDb,
    private mapper: UserMapper,  // ✓ Mapper is injected
  ) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query.user.findFirst({ where: eq(user.id, id) });
    return row ? this.mapper.toDomain(row) : null;  // ✓ DB row → Domain entity
  }

  async save(entity: User): Promise<void> {
    const row = this.mapper.toPersistence(entity);   // ✓ Domain entity → DB row
    await this.db.insert(user).values(row);
  }
}
```

Without a mapper, the repository leaks ORM types into the domain. **This is a critical failure.**

### D.3 Handlers Don't Touch Repositories

HTTP handlers MUST call use cases, NOT repositories:

**FAIL (rewrite required):**
```typescript
// ❌ Handler talks directly to repository
app.get('/orders/:id', async (c) => {
  const repo = new OrderDrizzleRepository(db);
  const order = await repo.findById(c.req.param('id'));  // ❌
  return c.json(order);
});
```

**PASS:**
```typescript
// ✓ Handler delegates to use case
app.get('/orders/:id', async (c) => {
  const result = await getOrderUseCase.execute({ orderId: c.req.param('id') });  // ✓
  return c.json(result);
});
```

---

## Section E: Common Agent Cheats — Detection Guide

### Cheat Pattern 1: "Service" Class with Everything

**What it looks like:**
```typescript
// src/modules/order/service.ts
export class OrderService {
  async createOrder(data) {
    // Validation
    // DB query
    // Business logic
    // External API call
    // Response formatting
  }
}
```

**Why it's wrong:** Business logic + DB + HTTP all mixed. Cannot test without full stack.

**Fix:** Split into:
- `domain/entities/order.ts` — Business logic (invariant validation)
- `application/use-cases/create-order.ts` — Orchestration (6-step structure)
- `infrastructure/persistence/order-repository.ts` — DB access
- `interface/http/order-handler.ts` — HTTP handling

### Cheat Pattern 2: ORM Entity = Domain Entity

**What it looks like:**
```typescript
// src/domain/entities/order.ts
import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';  // ❌ ORM in domain!

export const order = pgTable('order', {
  id: uuid('id').primaryKey(),
  status: varchar('status'),
});
```

**Why it's wrong:** The domain depends on the persistence technology. Swap PostgreSQL for MongoDB → domain breaks.

**Fix:** Create TWO files:
- `infrastructure/persistence/schema.ts` — Drizzle schema (pgTable, columns)
- `domain/entities/order.ts` — Pure class with behavior, zero imports

### Cheat Pattern 3: "Pragmatic" Dependency Injection (No DI)

**What it looks like:**
```typescript
// Use case creates its own dependencies
export class CreateOrderUseCase {
  async execute(dto) {
    const db = createDbConnection(process.env.DATABASE_URL);
    const repo = new OrderDrizzleRepository(db);  // ❌
    // ...
  }
}
```

**Why it's wrong:** Cannot test without a real database. Cannot swap implementations.

**Fix:** Constructor injection with interfaces.

### Cheat Pattern 4: Repository Returns ORM Types

**What it looks like:**
```typescript
// domain/repositories/order-repository.ts
export interface IOrderRepository {
  findById(id: string): Promise<OrderSchema | null>;  // ❌ Returns DB type!
}
```

**Why it's wrong:** Application layer receives DB rows instead of domain entities. Business logic cannot run on DB rows.

**Fix:** Return `Promise<Order | null>` where `Order` is the domain entity class. Map DB → Domain in the infrastructure repository.

### Cheat Pattern 5: Horizontal Module Structure

**What it looks like:**
```
src/
├── modules/
│   ├── identity/
│   │   ├── routes.ts      ← HTTP
│   │   ├── service.ts     ← Business + DB mixed
│   │   └── repository.ts  ← DB access
│   ├── orders/
│   │   ├── routes.ts
│   │   ├── service.ts
│   │   └── repository.ts
```

**Why it's wrong:** Each "module" violates layer boundaries. HTTP + business + DB all together.

**Fix:** Vertical layers, not horizontal modules:
```
src/
├── domain/       ← All business logic, all entities
├── application/  ← All use cases
├── infrastructure/ ← All DB, cache, external APIs
└── interface/    ← All HTTP, routes, middleware
```

---

## Section F: Final Verification Steps

Before delivering the boilerplate, perform these automated checks:

### F.1 Import Boundary Check

```bash
# These grep commands must return ZERO results:
# (adapt syntax to your language)

# 1. Domain imports from infrastructure
grep -r "from.*infrastructure" src/domain/          # Must be empty
grep -r "import.*infrastructure" src/domain/        # Must be empty

# 2. Domain imports from interface
grep -r "from.*interface" src/domain/               # Must be empty
grep -r "import.*interface" src/domain/             # Must be empty

# 3. Application imports from interface
grep -r "from.*interface" src/application/          # Must be empty

# 4. Application imports from ORM/framework
grep -r "drizzle-orm\|typeorm\|prisma\|sqlalchemy\|gorm" src/domain/ src/application/

# 5. Interface imports from infrastructure (allowed but should go through DI)
# This one CAN have results — handlers instantiate implementations via DI container
```

### F.2 Test Without Database

Unit tests for use cases MUST pass with in-memory repositories. If they require PostgreSQL, the architecture is wrong.

```bash
# Unit tests should run with:
npm run test:unit    # No docker needed
# NOT:
npm run test:unit    # Fails with "cannot connect to postgres"
```

### F.3 Count Files Per Layer

| Layer | Min Files | What to Count |
|-------|-----------|---------------|
| `domain/entities/` | ≥ number of aggregates | One entity file per aggregate root |
| `domain/repositories/` | ≥ number of aggregates | One interface per aggregate |
| `application/use-cases/` | ≥ number of user stories | One use case per action |
| `infrastructure/persistence/` | ≥ number of aggregates | One implementation + one mapper per repo |
| `interface/http/` | ≥ number of route groups | One handler per resource |

**If domain/ has fewer files than infrastructure/, the agent likely put domain logic in the wrong layer.**
