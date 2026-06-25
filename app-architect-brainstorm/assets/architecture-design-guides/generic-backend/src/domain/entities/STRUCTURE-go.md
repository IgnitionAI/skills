# Implementation: Domain Entity — Go

> **Design Structure Guide — go**
>
> This document shows how the Clean Architecture pattern maps to go syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```go
// src/domain/entities/user.go
package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// User is a domain entity representing a user.
type User struct {
	id        uuid.UUID
	email     Email
	name      string
	createdAt time.Time
	updatedAt time.Time
	events    []DomainEvent
}

// NewUser creates a new user with validation.
func NewUser(email string, name string) (*User, error) {
	if len(name) < 2 {
		return nil, errors.New("name must be at least 2 characters")
	}

	em, err := NewEmail(email)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	return &User{
		id:        uuid.New(),
		email:     em,
		name:      name,
		createdAt: now,
		updatedAt: now,
	}, nil
}

// ReconstituteUser recreates a user from database data (no validation).
func ReconstituteUser(id uuid.UUID, email string, name string, createdAt time.Time, updatedAt time.Time) (*User, error) {
	em, err := ParseEmail(email) // Parse, don't validate
	if err != nil {
		return nil, err
	}
	return &User{
		id:        id,
		email:     em,
		name:      name,
		createdAt: createdAt,
		updatedAt: updatedAt,
	}, nil
}

// ChangeName updates the user's name with validation.
func (u *User) ChangeName(newName string) error {
	if len(newName) < 2 {
		return errors.New("name must be at least 2 characters")
	}
	u.name = newName
	u.touch()
	return nil
}

// Getters — Go uses exported methods for read access.
func (u *User) ID() uuid.UUID        { return u.id }
func (u *User) Email() string        { return u.email.Value() }
func (u *User) Name() string         { return u.name }
func (u *User) CreatedAt() time.Time { return u.createdAt }
func (u *User) UpdatedAt() time.Time { return u.updatedAt }

// PullEvents returns and clears pending domain events.
func (u *User) PullEvents() []DomainEvent {
	events := u.events
	u.events = nil
	return events
}

// touch updates the updatedAt timestamp.
func (u *User) touch() {
	u.updatedAt = time.Now()
}
```

### Notes
- Go uses unexported fields + getter methods (convention: `Field()` not `GetField()`)
- `uuid` package: `github.com/google/uuid`
- Error handling: return `(T, error)` from all fallible operations
- No exceptions — explicit error returns throughout
