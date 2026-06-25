# Implementation: Repository Interface — Python

> **Design Structure Guide — python**
>
> This document shows how the Clean Architecture pattern maps to python syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```python
# src/domain/repositories/user_repository.py
from typing import Protocol, Optional, Tuple, List
from uuid import UUID

from domain.entities.user import User


class UserRepository(Protocol):
    """Repository interface for User aggregate. Implementations live in infrastructure."""

    async def get_by_id(self, user_id: UUID) -> Optional[User]: ...
    async def get_by_email(self, email: str) -> Optional[User]: ...
    async def list_all(self, skip: int = 0, limit: int = 100) -> Tuple[List[User], int]: ...
    async def save(self, user: User) -> None: ...
    async def delete(self, user_id: UUID) -> None: ...
    async def exists(self, user_id: UUID) -> bool: ...
```

### Alternative: Abstract Base Class (ABC)
```python
# src/domain/repositories/user_repository.py
from abc import ABC, abstractmethod
from typing import Optional, Tuple, List
from uuid import UUID

from domain.entities.user import User


class UserRepository(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: UUID) -> Optional[User]: ...

    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]: ...

    @abstractmethod
    async def list_all(self, skip: int = 0, limit: int = 100) -> Tuple[List[User], int]: ...

    @abstractmethod
    async def save(self, user: User) -> None: ...

    @abstractmethod
    async def delete(self, user_id: UUID) -> None: ...

    @abstractmethod
    async def exists(self, user_id: UUID) -> bool: ...
```

### In-Memory Implementation (for unit tests)
```python
# tests/unit/in_memory_user_repository.py
from uuid import UUID
from typing import Optional, Tuple, List


class InMemoryUserRepository:
    """In-memory implementation for fast unit tests."""

    def __init__(self):
        self._users: dict[UUID, User] = {}

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        return self._users.get(user_id)

    async def get_by_email(self, email: str) -> Optional[User]:
        for user in self._users.values():
            if user.email == email:
                return user
        return None

    async def list_all(self, skip: int = 0, limit: int = 100) -> Tuple[List[User], int]:
        users = list(self._users.values())
        return users[skip:skip + limit], len(users)

    async def save(self, user: User) -> None:
        self._users[user.id] = user

    async def delete(self, user_id: UUID) -> None:
        self._users.pop(user_id, None)

    async def exists(self, user_id: UUID) -> bool:
        return user_id in self._users
```

### Notes
- `Protocol` (Python 3.8+) allows structural subtyping — no explicit `implements` needed
- ABC is more explicit and gives better error messages for missing methods
- Use `Protocol` for flexibility, `ABC` for strictness
