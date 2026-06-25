# Pattern: HTTP Handler / Controller

## Purpose
The HTTP handler is the entry point for web requests. It receives HTTP requests, delegates to use cases, and formats HTTP responses. This is the ONLY layer that knows about HTTP.

## Rules
1. **Delegate, don't decide** — No business logic; call use case, return result
2. **Validate input format** — Schema validation (shape, types, required fields)
3. **Map errors to HTTP status** — Domain errors → appropriate HTTP codes
4. **Return consistent response format** — Always same envelope structure
5. **No direct DB access** — Go through use cases only
6. **Framework code lives here only** — HTTP-specific code is isolated to this layer

## Structure

```
{Entity}Handler / {Entity}Controller
├── constructor(useCases..., middleware)
├── create(request): 201 + Location header  → POST /api/v1/{resource}
├── list(request): 200 + paginated body     → GET /api/v1/{resource}
├── getById(request): 200 | 404            → GET /api/v1/{resource}/:id
├── update(request): 200 | 404             → PATCH /api/v1/{resource}/:id
└── delete(request): 204                   → DELETE /api/v1/{resource}/:id
```

## Error Mapping

| Error Type | HTTP Status | Response Body |
|------------|-------------|---------------|
| Validation failure | 400 | `{ "error": "VALIDATION", "details": [...] }` |
| Authentication missing | 401 | `{ "error": "UNAUTHENTICATED" }` |
| Authorization failure | 403 | `{ "error": "FORBIDDEN" }` |
| Resource not found | 404 | `{ "error": "NOT_FOUND" }` |
| Domain rule violation | 422 | `{ "error": "DOMAIN_ERROR", "message": "..." }` |
| Conflict (duplicate, etc.) | 409 | `{ "error": "CONFLICT" }` |
| Server error | 500 | `{ "error": "INTERNAL" }` |

## Response Envelope

```json
// Success (2xx)
{
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100 }
}

// Error (4xx/5xx)
{
  "error": "ERROR_CODE",
  "message": "Human readable description",
  "details": [ { "field": "email", "message": "Invalid format" } ]
}
```

## URL Conventions

| Method | Path | Action | Status |
|--------|------|--------|--------|
| POST | `/api/v1/orders` | Create | 201 Created |
| GET | `/api/v1/orders` | List (paginated) | 200 OK |
| GET | `/api/v1/orders/:id` | Get one | 200 OK / 404 |
| PATCH | `/api/v1/orders/:id` | Partial update | 200 OK / 404 |
| DELETE | `/api/v1/orders/:id` | Delete | 204 No Content |
| POST | `/api/v1/orders/:id/actions/:action` | Custom action | 200 OK |

## Anti-Patterns
- ❌ Business logic in the handler (`if (user.isAdmin) { ... }`)
- ❌ Direct repository/database access from handler
- ❌ Returning different response formats per endpoint
- ❌ Catching all exceptions and returning 200
- ❌ Exposing stack traces or internal details in error responses

## RED FLAGS — Agent Cheats (Detection)

| Cheat Pattern | What It Looks Like | Why It's Wrong |
|-------------|-------------------|----------------|
| **Direct DB access** | `const order = await db.query.order.findFirst()` in handler | Handler bypasses use cases and domain logic |
| **Instantiates repo** | `const repo = new OrderRepository()` in handler | No DI, untestable |
| **Business logic** | `if (order.total > 1000) { ... }` in handler | Logic should be in domain entity |
| **No error mapping** | `return c.json(error)` with 200 status | Client cannot distinguish success/failure |
| **Returns ORM type** | `c.json(orderSchema)` directly | Leaks internal data structure to client |

**Verify: Handlers call use cases, never repositories:**
```bash
grep -r "Repository\|db\.query\|db\.select\|db\.insert" src/interface/http/
# Must return EMPTY (handlers delegate to use cases)
```

## File Location
`src/interface/http/{entity}-handler.ts|py|go|rs|java|cs`

## Read Next
Select the IMPL file for your chosen language:
- `IMPL-typescript.md` — NestJS-style controllers
- `IMPL-python.md` — FastAPI routers
- `IMPL-go.md` — Gin/Echo handlers
- `IMPL-rust.md` — Axum handlers
- `IMPL-java.md` — Spring Boot controllers
- `IMPL-csharp.md` — ASP.NET Core controllers / Minimal APIs
