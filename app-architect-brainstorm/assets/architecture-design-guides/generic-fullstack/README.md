# Architecture Design Guide: Fullstack Web Application

## Purpose

Design patterns for a web application with both backend API and browser-based frontend.

## Monorepo Structure (Design)

```
{project}/
├── backend/                    # See: generic-backend guide
│   ├── src/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── interface/
│   └── tests/
├── frontend/                   # Browser-based UI
│   ├── src/
│   │   ├── features/           # Feature-based modules
│   │   │   ├── auth/
│   │   │   └── {feature}/
│   │   ├── shared/             # Cross-feature utilities
│   │   └── app/                # App shell, router, providers
│   └── tests/
├── shared/
│   └── types/                  # Shared DTO types (generated from API spec)
└── docs/
    └── architecture/           # Architecture documents live here
```

## Frontend Architecture Patterns

### Feature-Based Organization

Each feature owns its components, hooks, API calls, and state:

```
features/{feature}/
├── components/         # Feature-specific UI
├── hooks/              # Data fetching + mutations
├── api/                # API calls for this feature
├── types.ts            # Feature-specific types
└── index.ts            # Public API (barrel export)
```

### State Management Decision Tree

| State Type | Solution | When |
|------------|----------|------|
| Local UI | `useState` / signals | Component-only (< 5 shared) |
| Shared UI | Lightweight store | Theme, sidebar, modal |
| Server state | TanStack Query / SWR | API data with caching |
| Form state | React Hook Form + Zod | All forms |
| URL state | Router params | Filters, pagination |
| Global | Zustand / Pinia / signals | Auth, permissions |

### Backend-for-Frontend (BFF) Pattern

When the frontend needs aggregated data:
- Option A: Frontend makes multiple API calls (simple, more requests)
- Option B: BFF layer in backend combines endpoints (complex, fewer requests)
- Decision: Use BFF when a page needs > 3 API calls to render

## API Contract Between Frontend and Backend

1. Backend defines OpenAPI/Swagger spec first
2. Frontend types generated from spec
3. Shared types in `shared/types/` (generated, not hand-written)
4. API versioning agreed upfront
─ {{feature}}Api.ts
├── types.ts            # Feature-specific types
└── index.ts            # Public API (barrel export)
```

### State Management Strategy

| State Type | Solution | Where |
|------------|----------|-------|
| Server state | TanStack Query / SWR | API data with caching |
| Form state | React Hook Form + Zod / VeeValidate | All forms |
| Global UI | Zustand / Pinia / signals | Theme, sidebar, modal |
| URL state | Router params + search params | Filters, pagination |
| Local | useState / signals | Component-only |

### API Integration Pattern
```typescript
// shared/api/queryClient.ts
// shared/api/client.ts      # Axios/fetch with interceptors

// features/orders/api/orderApi.ts
export const orderApi = {
  getOrders: (filters) => api.get('/orders', { params: filters }),
  getOrder: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.patch(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
};

// features/orders/hooks/useOrders.ts
export function useOrders(filters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => orderApi.getOrders(filters),
  });
}

// features/orders/hooks/useCreateOrder.ts
export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: orderApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}
```

## Development

```bash
# Start everything
docker compose up -d

# Or start separately:
# Terminal 1: Backend
# cd backend && {{DEV_COMMAND}}

# Terminal 2: Frontend
# cd frontend && npm run dev

# Terminal 3: Database
docker compose up postgres redis
```
