# Implementation: Use Case — TypeScript

> **Design Structure Guide — typescript**
>
> This document shows how the Clean Architecture pattern maps to typescript syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```typescript
// src/application/use-cases/create-order.ts
import { IOrderRepository } from '../../domain/repositories/order-repository';
import { IUserRepository } from '../../domain/repositories/user-repository';
import { Order } from '../../domain/entities/order';
import { IEventBus } from '../ports/event-bus';

// Request DTO
export interface CreateOrderRequest {
  userId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
}

// Response DTO
export interface CreateOrderResponse {
  orderId: string;
  total: number;
  status: string;
}

// Errors
export class UserNotFoundError extends Error {
  constructor(userId: string) { super(`User ${userId} not found`); }
}

export class EmptyOrderError extends Error {
  constructor() { super('Order must contain at least one item'); }
}

// Use Case
export class CreateOrderUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private userRepository: IUserRepository,
    private eventBus: IEventBus,
  ) {}

  async execute(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    // 1. Fetch user (fail fast)
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new UserNotFoundError(request.userId);
    }

    // 2. Validate input
    if (!request.items || request.items.length === 0) {
      throw new EmptyOrderError();
    }

    // 3. Execute domain logic
    const order = Order.create(user.id, request.items);

    // 4. Save
    await this.orderRepository.save(order);

    // 5. Publish events
    const events = order.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    // 6. Return DTO
    return {
      orderId: order.id,
      total: order.total,
      status: order.status,
    };
  }
}
```

### DI Registration (NestJS)
```typescript
// In module:
{ provide: CreateOrderUseCase, useClass: CreateOrderUseCase }

// Or with interface for testability:
{ provide: 'ICreateOrderUseCase', useClass: CreateOrderUseCase }
```

### Unit Test
```typescript
// tests/unit/create-order.test.ts
import { CreateOrderUseCase, CreateOrderRequest, UserNotFoundError } from './create-order';
import { InMemoryOrderRepository } from '../test-util/in-memory-order-repository';
import { InMemoryUserRepository } from '../test-util/in-memory-user-repository';
import { InMemoryEventBus } from '../test-util/in-memory-event-bus';
import { User } from '../../domain/entities/user';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let orderRepo: InMemoryOrderRepository;
  let userRepo: InMemoryUserRepository;
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    userRepo = new InMemoryUserRepository();
    eventBus = new InMemoryEventBus();
    useCase = new CreateOrderUseCase(orderRepo, userRepo, eventBus);
  });

  it('creates an order for existing user', async () => {
    const user = User.create('test@test.com', 'Test User');
    await userRepo.save(user);

    const result = await useCase.execute({
      userId: user.id,
      items: [{ productId: 'prod-1', quantity: 2, price: 10.0 }],
    });

    expect(result.orderId).toBeDefined();
    expect(result.total).toBe(20.0);
    expect(result.status).toBe('pending');
  });

  it('fails when user not found', async () => {
    await expect(useCase.execute({
      userId: 'nonexistent',
      items: [{ productId: 'prod-1', quantity: 1, price: 10.0 }],
    })).rejects.toThrow(UserNotFoundError);
  });
});
```
