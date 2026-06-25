# Implementation: Use Case — Java

> **Design Structure Guide — java**
>
> This document shows how the Clean Architecture pattern maps to java syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```java
// src/application/usecases/CreateOrderUseCase.java
package application.usecases;

import domain.entities.Order;
import domain.entities.User;
import domain.events.EventBus;
import domain.repositories.OrderRepository;
import domain.repositories.UserRepository;

import java.util.List;
import java.util.UUID;

public class CreateOrderUseCase {
    private final OrderRepository orderRepo;
    private final UserRepository userRepo;
    private final EventBus eventBus;

    public CreateOrderUseCase(OrderRepository orderRepo, UserRepository userRepo, EventBus eventBus) {
        this.orderRepo = orderRepo;
        this.userRepo = userRepo;
        this.eventBus = eventBus;
    }

    public CreateOrderOutput execute(CreateOrderInput input) {
        // 1. Fetch user
        var user = userRepo.findById(input.userId())
            .orElseThrow(() -> new UserNotFoundException(input.userId()));

        // 2. Validate
        if (input.items() == null || input.items().isEmpty()) {
            throw new EmptyOrderException();
        }

        // 3. Domain logic
        var items = input.items().stream()
            .map(i -> new Order.OrderItem(i.productId(), i.quantity(), i.price()))
            .toList();

        var order = Order.create(user.getId(), items);

        // 4. Save
        orderRepo.save(order);

        // 5. Publish events
        for (var event : order.pullEvents()) {
            eventBus.publish(event);
        }

        // 6. Return
        return new CreateOrderOutput(order.getId(), order.getTotal(), order.getStatus());
    }

    // Input/Output records
    public record CreateOrderInput(UUID userId, List<OrderItemInput> items) {
        public record OrderItemInput(String productId, int quantity, double price) {}
    }

    public record CreateOrderOutput(UUID orderId, double total, String status) {}

    // Errors
    public static class UserNotFoundException extends RuntimeException {
        public UserNotFoundException(UUID userId) { super("User " + userId + " not found"); }
    }

    public static class EmptyOrderException extends RuntimeException {
        public EmptyOrderException() { super("Order must contain at least one item"); }
    }
}
```

### With Spring @Transactional
```java
@Service
@RequiredArgsConstructor
public class CreateOrderUseCase {
    private final OrderRepository orderRepo;
    private final UserRepository userRepo;
    private final EventBus eventBus;

    @Transactional
    public CreateOrderOutput execute(CreateOrderInput input) {
        // ... same as above, transaction wraps the whole method
    }
}
```

### Unit Test
```java
// tests/unit/CreateOrderUseCaseTest.java
package unit;

import application.usecases.CreateOrderUseCase;
import domain.entities.User;
import org.junit.jupiter.api.Test;
import testutil.InMemoryOrderRepository;
import testutil.InMemoryUserRepository;
import testutil.InMemoryEventBus;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class CreateOrderUseCaseTest {
    @Test
    void createsOrderForExistingUser() {
        var userRepo = new InMemoryUserRepository();
        var orderRepo = new InMemoryOrderRepository();
        var eventBus = new InMemoryEventBus();

        var user = User.create("test@test.com", "Test User");
        userRepo.save(user);

        var uc = new CreateOrderUseCase(orderRepo, userRepo, eventBus);
        var result = uc.execute(new CreateOrderUseCase.CreateOrderInput(
            user.getId(),
            List.of(new CreateOrderUseCase.CreateOrderInput.OrderItemInput("prod-1", 2, 10.0))
        ));

        assertEquals(20.0, result.total());
        assertEquals("pending", result.status());
    }

    @Test
    void failsWhenUserNotFound() {
        var uc = new CreateOrderUseCase(
            new InMemoryOrderRepository(),
            new InMemoryUserRepository(),
            new InMemoryEventBus()
        );

        assertThrows(CreateOrderUseCase.UserNotFoundException.class, () ->
            uc.execute(new CreateOrderUseCase.CreateOrderInput(
                UUID.randomUUID(),
                List.of(new CreateOrderUseCase.CreateOrderInput.OrderItemInput("p1", 1, 10.0))
            ))
        );
    }
}
```
