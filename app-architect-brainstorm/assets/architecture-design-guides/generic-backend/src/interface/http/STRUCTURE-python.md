# Implementation: HTTP Handler — Python (FastAPI)

> **Design Structure Guide — python**
>
> This document shows how the Clean Architecture pattern maps to python syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```python
# src/interface/http/order_router.py
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from application.use_cases.create_order import CreateOrderUseCase, CreateOrderRequest, UserNotFoundError, EmptyOrderError
from application.use_cases.get_order import GetOrderUseCase
from infrastructure.dependencies import get_create_order_use_case, get_get_order_use_case

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


# Request/Response schemas (Pydantic)
class OrderItemSchema(BaseModel):
    product_id: str = Field(..., min_length=1)
    quantity: int = Field(..., ge=1)
    price: float = Field(..., ge=0)


class CreateOrderSchema(BaseModel):
    user_id: UUID
    items: list[OrderItemSchema] = Field(..., min_length=1)


class OrderResponse(BaseModel):
    order_id: UUID
    total: float
    status: str


@router.post("", status_code=status.HTTP_201_CREATED, response_model=OrderResponse)
async def create_order(
    schema: CreateOrderSchema,
    use_case: Annotated[CreateOrderUseCase, Depends(get_create_order_use_case)],
):
    try:
        result = await use_case.execute(CreateOrderRequest(
            user_id=schema.user_id,
            items=[item.model_dump() for item in schema.items],
        ))
        return OrderResponse(
            order_id=result.order_id,
            total=result.total,
            status=result.status,
        )
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except EmptyOrderError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    use_case: Annotated[GetOrderUseCase, Depends(get_get_order_use_case)],
):
    result = await use_case.execute(order_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse(
        order_id=result.order_id,
        total=result.total,
        status=result.status,
    )


@router.get("")
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    return {"data": [], "meta": {"page": page, "limit": limit, "total": 0}}
```

### Dependencies (DI)
```python
# src/infrastructure/dependencies.py
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.persistence.sqlalchemy.order_repository import SqlAlchemyOrderRepository
from infrastructure.persistence.sqlalchemy.user_repository import SqlAlchemyUserRepository
from infrastructure.persistence.database import get_db_session
from application.use_cases.create_order import CreateOrderUseCase
from application.use_cases.get_order import GetOrderUseCase
from application.ports.event_bus import EventBus
from infrastructure.messaging.redis_event_bus import RedisEventBus


async def get_order_repository(db: AsyncSession = Depends(get_db_session)):
    return SqlAlchemyOrderRepository(db)


async def get_user_repository(db: AsyncSession = Depends(get_db_session)):
    return SqlAlchemyUserRepository(db)


async def get_event_bus() -> EventBus:
    return RedisEventBus()


async def get_create_order_use_case(
    order_repo=Depends(get_order_repository),
    user_repo=Depends(get_user_repository),
    event_bus=Depends(get_event_bus),
) -> CreateOrderUseCase:
    return CreateOrderUseCase(order_repo, user_repo, event_bus)


async def get_get_order_use_case(
    order_repo=Depends(get_order_repository),
) -> GetOrderUseCase:
    return GetOrderUseCase(order_repo)
```

### Main App Registration
```python
# src/main.py
from fastapi import FastAPI
from interface.http import order_router

app = FastAPI(title="{{PROJECT_NAME}}", version="1.0.0")
app.include_router(order_router.router)

# Global exception handler
from fastapi.requests import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_code = _map_error_code(exc)
    status_code = 500 if error_code == "INTERNAL" else 422
    return JSONResponse(
        status_code=status_code,
        content={"error": error_code, "message": str(exc)},
    )

def _map_error_code(exc: Exception) -> str:
    name = type(exc).__name__
    mapping = {
        "UserNotFoundError": "NOT_FOUND",
        "EmptyOrderError": "DOMAIN_ERROR",
    }
    return mapping.get(name, "INTERNAL")
```
