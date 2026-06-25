# Implementation: Use Case — Python

> **Design Structure Guide — python**
>
> This document shows how the Clean Architecture pattern maps to python syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```python
# src/application/use_cases/create_order.py
from dataclasses import dataclass
from uuid import UUID

from domain.repositories.order_repository import OrderRepository
from domain.repositories.user_repository import UserRepository
from domain.entities.order import Order
from application.ports.event_bus import EventBus


@dataclass
class CreateOrderRequest:
    user_id: UUID
    items: list[dict]  # [{"product_id": str, "quantity": int, "price": float}]


@dataclass
class CreateOrderResponse:
    order_id: UUID
    total: float
    status: str


class UserNotFoundError(Exception):
    pass


class EmptyOrderError(Exception):
    pass


class CreateOrderUseCase:
    def __init__(
        self,
        order_repo: OrderRepository,
        user_repo: UserRepository,
        event_bus: EventBus,
    ):
        self.order_repo = order_repo
        self.user_repo = user_repo
        self.event_bus = event_bus

    async def execute(self, request: CreateOrderRequest) -> CreateOrderResponse:
        # 1. Fetch user (fail fast)
        user = await self.user_repo.get_by_id(request.user_id)
        if user is None:
            raise UserNotFoundError(f"User {request.user_id} not found")

        # 2. Validate input
        if not request.items:
            raise EmptyOrderError("Order must contain at least one item")

        # 3. Execute domain logic
        order = Order.create(user_id=user.id, items=request.items)

        # 4. Save
        await self.order_repo.save(order)

        # 5. Publish events
        for event in order.pull_events():
            await self.event_bus.publish(event)

        # 6. Return DTO
        return CreateOrderResponse(
            order_id=order.id,
            total=order.total,
            status=order.status,
        )
```

### DI with FastAPI
```python
# src/infrastructure/dependencies.py
from fastapi import Depends

from infrastructure.persistence.sqlalchemy.order_repository import SqlAlchemyOrderRepository
from infrastructure.persistence.sqlalchemy.user_repository import SqlAlchemyUserRepository
from infrastructure.messaging.redis_event_bus import RedisEventBus
from application.use_cases.create_order import CreateOrderUseCase

async def get_create_order_use_case(
    order_repo: OrderRepository = Depends(get_order_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    event_bus: EventBus = Depends(get_event_bus),
) -> CreateOrderUseCase:
    return CreateOrderUseCase(order_repo, user_repo, event_bus)
```

### Unit Test
```python
# tests/unit/test_create_order.py
import pytest
from uuid import uuid4

from application.use_cases.create_order import CreateOrderUseCase, CreateOrderRequest, UserNotFoundError
from tests.unit.in_memory_order_repository import InMemoryOrderRepository
from tests.unit.in_memory_user_repository import InMemoryUserRepository
from tests.unit.in_memory_event_bus import InMemoryEventBus
from domain.entities.user import User


@pytest.fixture
def use_case():
    return CreateOrderUseCase(
        order_repo=InMemoryOrderRepository(),
        user_repo=InMemoryUserRepository(),
        event_bus=InMemoryEventBus(),
    )


@pytest.mark.asyncio
async def test_creates_order_for_existing_user(use_case):
    user = User.create("test@test.com", "Test User")
    await use_case.user_repo.save(user)

    result = await use_case.execute(CreateOrderRequest(
        user_id=user.id,
        items=[{"product_id": "prod-1", "quantity": 2, "price": 10.0}],
    ))

    assert result.total == 20.0
    assert result.status == "pending"


@pytest.mark.asyncio
async def test_fails_when_user_not_found(use_case):
    with pytest.raises(UserNotFoundError):
        await use_case.execute(CreateOrderRequest(
            user_id=uuid4(),
            items=[{"product_id": "prod-1", "quantity": 1, "price": 10.0}],
        ))
```
