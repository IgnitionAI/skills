# Pattern: Use Case

## Purpose
A use case encapsulates a single user story or business workflow. It orchestrates domain entities and repositories to accomplish one specific thing.

## Rules
1. **One use case per user story** — `CreateOrder`, not `OrderService` with 10 methods
2. **Receives DTO, returns DTO** — Never expose domain entities at the boundary
3. **No framework code** — No HTTP, no ORM, no JSON serialization
4. **Orchestrates, decides** — Calls domain methods, handles errors, publishes events
5. **Dependencies via constructor** — Repository interfaces injected, not instantiated
6. **Transactions wrap the whole use case** — All-or-nothing
7. **Idempotent where possible** — Same input → same result, safe to retry

## Structure

```
{Action}{Entity}UseCase
├── constructor(repository, otherDependencies)
├── execute(input: RequestDTO): ResponseDTO
│   ├── 1. Validate input format
│   ├── 2. Fetch required entities (fail fast if not found)
│   ├── 3. Execute domain logic (entity methods)
│   ├── 4. Save changes
│   ├── 5. Publish domain events
│   └── 6. Return response DTO
└── (private helpers if needed)
```

## Naming Convention
- **Class/struct**: `{Verb}{Noun}UseCase` — `CreateOrderUseCase`, `GetUserUseCase`
- **Method**: `execute(input)` — Always the same entry point
- **Request DTO**: `{Action}{Entity}Request` — `CreateOrderRequest`
- **Response DTO**: `{Action}{Entity}Response` — `CreateOrderResponse` (or just return the entity ID)

## Error Handling
- **Input validation**: Fail before any DB call (fail fast)
- **Not found**: Specific error type, caught by HTTP layer → 404
- **Domain violation**: Specific error type → 422
- **Infrastructure failure**: Wrap with context, let global handler deal with it → 500

## Testing
- **Unit test with in-memory repositories** — Fast, no I/O
- **One test per scenario**: Happy path + each error case
- **Mock only external services** — Use real in-memory repos for domain tests

## Anti-Patterns
- ❌ "Service" class with many methods (`OrderService.create()`, `.update()`, `.delete()`)
- ❌ Business logic in the use case (should be in the entity)
- ❌ Direct ORM usage (go through repository interface)
- ❌ Returning domain entities (always map to DTO)
- ❌ Catching all exceptions silently

## RED FLAGS — Agent Cheats (Detection)

| Cheat Pattern | What It Looks Like | Why It's Wrong |
|-------------|-------------------|----------------|
| **Instantiates repo** | `const repo = new UserDrizzleRepository()` inside `execute()` | Cannot test without real DB |
| **Direct DB queries** | `db.select().from(users).where(...)` in use case | Application depends on infrastructure |
| **Business logic here** | `if (score > 0.5) { order.approve() }` | Logic should be in `order.canApprove()` |
| **ORM model manipulation** | `orderSchema.status = 'scored'` | Manipulates DB row, not domain entity |
| **Returns ORM type** | `return orderSchema` instead of `return OrderResponseDto` | Leaks persistence to interface |
| **HTTP imports** | `import { HonoRequest } from 'hono'` in use case | Application must not know about HTTP |

**Verify: `src/application/` has zero HTTP/ORM imports:**
```bash
grep -r "hono\|express\|fastify\|drizzle\|typeorm\|prisma" src/application/
# Must return EMPTY
```

## File Location
`src/application/use-cases/{action}-{entity}.ts|py|go|rs|java|cs`

## Read Next
Select the IMPL file for your chosen language:
- `IMPL-typescript.md`
- `IMPL-python.md`
- `IMPL-go.md`
- `IMPL-rust.md`
- `IMPL-java.md`
- `IMPL-csharp.md`
