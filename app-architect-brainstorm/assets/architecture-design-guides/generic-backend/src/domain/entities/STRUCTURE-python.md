# Implementation: Domain Entity — Python

> **Design Structure Guide — python**
>
> This document shows how the Clean Architecture pattern maps to python syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```python
# src/domain/entities/user.py
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4

from domain.value_objects.email import Email
from domain.events.domain_event import DomainEvent


@dataclass
class User:
    """User entity. Use User.create() or User.reconstitute() to instantiate."""
    
    # Use private init to enforce factory methods
    _initialized: bool = field(default=False, repr=False)
    
    id: UUID = field(default_factory=uuid4)
    email: Email = field(default=None)  # type: ignore
    name: str = field(default="")
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    _events: list[DomainEvent] = field(default_factory=list, repr=False)

    def __post_init__(self):
        if not self._initialized:
            raise RuntimeError("Use User.create() or User.reconstitute()")

    @classmethod
    def create(cls, email: str, name: str) -> "User":
        if not name or len(name) < 2:
            raise ValueError("Name must be at least 2 characters")
        
        user = cls.__new__(cls)
        object.__setattr__(user, '_initialized', True)
        object.__setattr__(user, 'id', uuid4())
        object.__setattr__(user, 'email', Email.create(email))
        object.__setattr__(user, 'name', name)
        object.__setattr__(user, 'created_at', datetime.utcnow())
        object.__setattr__(user, 'updated_at', datetime.utcnow())
        object.__setattr__(user, '_events', [])
        return user

    @classmethod
    def reconstitute(
        cls,
        id: UUID,
        email: str,
        name: str,
        created_at: datetime,
        updated_at: datetime,
    ) -> "User":
        user = cls.__new__(cls)
        object.__setattr__(user, '_initialized', True)
        object.__setattr__(user, 'id', id)
        object.__setattr__(user, 'email', Email.reconstitute(email))
        object.__setattr__(user, 'name', name)
        object.__setattr__(user, 'created_at', created_at)
        object.__setattr__(user, 'updated_at', updated_at)
        object.__setattr__(user, '_events', [])
        return user

    def change_name(self, new_name: str) -> None:
        if not new_name or len(new_name) < 2:
            raise ValueError("Name must be at least 2 characters")
        object.__setattr__(self, 'name', new_name)
        self._touch()

    def _touch(self) -> None:
        object.__setattr__(self, 'updated_at', datetime.utcnow())

    def pull_events(self) -> list[DomainEvent]:
        events = self._events[:]
        object.__setattr__(self, '_events', [])
        return events
```

### Alternative: Pydantic-free with frozen dataclass (simpler, recommended)

```python
# src/domain/entities/user.py — simpler version
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4


class User:
    def __init__(self, id: UUID, email: str, name: str, created_at: datetime, updated_at: datetime):
        self.id = id
        self.email = email
        self.name = name
        self.created_at = created_at
        self.updated_at = updated_at
        self._events: list = []

    @classmethod
    def create(cls, email: str, name: str) -> User:
        if not name or len(name) < 2:
            raise ValueError("Name must be at least 2 characters")
        now = datetime.utcnow()
        return cls(uuid4(), email, name, now, now)

    @classmethod
    def reconstitute(cls, id: UUID, email: str, name: str, created_at: datetime, updated_at: datetime) -> User:
        return cls(id, email, name, created_at, updated_at)

    def change_name(self, new_name: str) -> None:
        if not new_name or len(new_name) < 2:
            raise ValueError("Name must be at least 2 characters")
        self.name = new_name
        self.updated_at = datetime.utcnow()

    def pull_events(self) -> list:
        events = self._events
        self._events = []
        return events
```

### Notes
- The frozen dataclass approach uses `__new__` + `object.__setattr__` to bypass immutability
- The simple class version is often cleaner for domain entities
- No Pydantic in domain — keep it pure Python
