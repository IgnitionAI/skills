# Implementation: Repository Interface — Go

> **Design Structure Guide — go**
>
> This document shows how the Clean Architecture pattern maps to go syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```go
// src/domain/repositories/user_repository.go
package domain

import (
	"context"

	"github.com/google/uuid"
)

// UserRepository defines persistence operations for the User aggregate.
// Implementations live in infrastructure/persistence/.
type UserRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	List(ctx context.Context, opts PaginationOptions) (*PaginatedResult[User], error)
	Save(ctx context.Context, user *User) error
	Delete(ctx context.Context, id uuid.UUID) error
	Exists(ctx context.Context, id uuid.UUID) (bool, error)
}

// PaginationOptions for list queries.
type PaginationOptions struct {
	Page      int
	Limit     int
	SortBy    string
	SortOrder string // "ASC" or "DESC"
}

// PaginatedResult holds a paginated list of items.
type PaginatedResult[T any] struct {
	Items      []T
	Total      int
	Page       int
	Limit      int
	TotalPages int
}
```

### In-Memory Implementation (for unit tests)
```go
// tests/unit/in_memory_user_repository.go
package testutil

import (
	"context"
	"sync"

	"github.com/google/uuid"
	"project/domain"
)

type InMemoryUserRepository struct {
	mu     sync.RWMutex
	users  map[uuid.UUID]*domain.User
}

func NewInMemoryUserRepository() *InMemoryUserRepository {
	return &InMemoryUserRepository{
		users: make(map[uuid.UUID]*domain.User),
	}
}

func (r *InMemoryUserRepository) GetByID(_ context.Context, id uuid.UUID) (*domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.users[id], nil // nil if not found
}

func (r *InMemoryUserRepository) GetByEmail(_ context.Context, email string) (*domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, u := range r.users {
		if u.Email() == email {
			return u, nil
		}
	}
	return nil, nil
}

func (r *InMemoryUserRepository) Save(_ context.Context, user *domain.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.users[user.ID()] = user
	return nil
}

func (r *InMemoryUserRepository) Delete(_ context.Context, id uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.users, id)
	return nil
}

func (r *InMemoryUserRepository) Exists(_ context.Context, id uuid.UUID) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, ok := r.users[id]
	return ok, nil
}
```

### Notes
- Go interfaces are satisfied implicitly — no `implements` keyword
- `context.Context` is first parameter of all async operations (Go convention)
- Return `(*T, error)` — never return bare `T` for fallible lookups
- `sync.RWMutex` for thread-safe in-memory store
- Pagination with generics (Go 1.18+)
