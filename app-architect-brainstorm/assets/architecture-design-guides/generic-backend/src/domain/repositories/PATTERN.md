# Pattern: Repository (Port)

## Purpose
A repository abstracts persistence operations for an aggregate root. It lives in the domain layer as an **interface** (port in hexagonal architecture). The concrete implementation (adapter) lives in `infrastructure/persistence/`.

## Rules
1. **Interface only** — No implementation, no SQL, no ORM queries
2. **One repository per aggregate root** — Not one per entity
3. **Return domain entities** — Not database rows, not DTOs
4. **Accept domain entities for save** — The repository maps to the storage format
5. **No pagination in basic interface** — Extend with `PaginatedRepository` when needed
6. **Async by default** — All methods return Promises/Futures/Tasks
7. **Named after the aggregate** — `UserRepository`, not `UserDao` or `UserTable`

## Interface Structure

```
{Entity}Repository (interface)
├── findById(id): Entity | null       # Primary lookup
├── findBy{Field}(value): Entity|null  # Common alternate lookup
├── findAll(options): PaginatedResult  # List with pagination
├── save(entity): void                 # Insert or update
├── delete(id): void                   # Hard delete (use sparingly)
└── exists(id): boolean                # Existence check
```

## Naming Conventions
- **Interface**: `IUserRepository` (C#, TS), `UserRepository` (Go trait, Java interface, Python Protocol), `UserRepository` (Rust trait)
- **Implementation**: `UserPostgresRepository`, `UserSqliteRepository`, `UserMemoryRepository` (for tests)
- **Method names**: `findById`, `findByEmail`, `save`, `delete` — not `get`, `fetch`, `store`, `remove`

## Testing with Repositories

The power of the repository pattern: swap implementations for testing.

| Environment | Implementation | Purpose |
|-------------|---------------|---------|
| Production | `UserPostgresRepository` | Real PostgreSQL |
| Integration tests | `UserPostgresRepository` + Testcontainers | Test real queries |
| Unit tests | `UserMemoryRepository` (in-memory hash map) | Fast, no I/O |
| E2E tests | `UserPostgresRepository` + Docker Compose | Full stack |

## Anti-Patterns
- ❌ SQL queries in the interface (`findBySql(query)`)
- ❌ ORM entities leaking into the interface (`findById(): UserOrmEntity`)
- ❌ Business logic in the repository (`findActiveUsers()` — that's a specification)
- ❌ Generic CRUD repository for all entities (each aggregate has specific needs)

## RED FLAGS — Agent Cheats (Detection)

| Cheat Pattern | What It Looks Like | Why It's Wrong |
|-------------|-------------------|----------------|
| **Concrete class** | `export class UserRepository { ... }` in `domain/` | Domain must depend on interfaces, not implementations |
| **Returns ORM type** | `findById(): Promise<UserSchema\|null>` | Application receives DB rows, not domain entities |
| **SQL in interface** | `findBySql(query: string)` | Leaks persistence details to domain |
| **No interface at all** | Repository directly imported from infrastructure | Domain depends on infrastructure (circular) |

**Verify: Every repository in `domain/repositories/` is an interface/trait/protocol:**
```bash
grep -L "interface\|trait\|Protocol\|ABC\|abstract" src/domain/repositories/*.ts
# Must return NO files (all are interfaces)
```

## File Location
`src/domain/repositories/{Entity}Repository.ts|py|go|rs|java|cs`

## Read Next
Select the IMPL file for your chosen language:
- `IMPL-typescript.md`
- `IMPL-python.md`
- `IMPL-go.md`
- `IMPL-rust.md`
- `IMPL-java.md`
- `IMPL-csharp.md`
