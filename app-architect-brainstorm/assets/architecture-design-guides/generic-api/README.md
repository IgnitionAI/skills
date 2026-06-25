# Architecture Design Guide: API-Only Service

## Purpose

Design patterns for a pure HTTP API consumed by machine clients (mobile apps, SPAs, other services).

Extends the backend service guide with API-specific concerns.

## API-First Design Principles

1. **Contract-first**: Define the API specification before any implementation planning.
2. **Version in URL**: `/api/v1/...`, `/api/v2/...`
3. **Consistent errors**: RFC 7807 Problem Details format
4. **Pagination everywhere**: Cursor for real-time feeds, offset for admin lists
5. **Idempotency keys**: For mutating operations (`Idempotency-Key` header)
6. **Rate limiting**: Per-client bucket, with standard `X-RateLimit-*` headers

## API Endpoint Structure

```
GET    /api/v1/{resource}          → List (paginated)
GET    /api/v1/{resource}/{id}     → Get one
POST   /api/v1/{resource}          → Create (returns 201 + Location header)
PATCH  /api/v1/{resource}/{id}     → Partial update
PUT    /api/v1/{resource}/{id}     → Full replace (rarely used)
DELETE /api/v1/{resource}/{id}     → Remove (returns 204)
POST   /api/v1/{resource}/{id}/actions/{action}  → RPC-style operations
```

## Request Lifecycle (Design)

```
HTTP Request
  → Router (match path + method)
  → Validation (schema check, sanitization)
  → Authentication (who?)
  → Authorization (what can they do?)
  → Rate Limiting
  → Use Case Execution (delegated to application layer)
  → Response Serialization
  → Error Handling (uniform format)
```

## Cross-Cutting Concerns

| Concern | Where | Standard |
|---------|-------|----------|
| Authentication | Middleware | JWT, OAuth2, or API key |
| Authorization | Middleware | RBAC or ACL |
| Rate limiting | Middleware | Token bucket (Redis-backed) |
| Request logging | Middleware | Structured JSON |
| Error format | Global handler | RFC 7807 Problem Details |
| API versioning | Router | URL path `/api/v1/` |
| CORS | Middleware | Configured per environment |
cript-fetch
# Python:     openapi-generator-cli generate -i spec.yaml -g python
# Go:         openapi-generator-cli generate -i spec.yaml -g go
# Rust:       openapi-generator-cli generate -i spec.yaml -g rust
```
