# Implementation: Use Case — C#

> **Design Structure Guide — csharp**
>
> This document shows how the Clean Architecture pattern maps to csharp syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```csharp
// src/Application/UseCases/CreateOrder.cs
namespace Application.UseCases;

using Domain.Entities;
using Domain.Repositories;
using Domain.Events;

public sealed class CreateOrderUseCase(
    IOrderRepository orderRepo,
    IUserRepository userRepo,
    IEventBus eventBus)
{
    public async Task<CreateOrderOutput> ExecuteAsync(CreateOrderInput input, CancellationToken ct = default)
    {
        // 1. Fetch user
        var user = await userRepo.GetByIdAsync(input.UserId, ct)
            ?? throw new UserNotFoundException(input.UserId);

        // 2. Validate
        if (input.Items.Count == 0)
            throw new EmptyOrderException();

        // 3. Domain logic
        var items = input.Items.Select(i => new OrderItem(i.ProductId, i.Quantity, i.Price)).ToList();
        var order = Order.Create(user.Id, items);

        // 4. Save
        await orderRepo.SaveAsync(order, ct);

        // 5. Publish events
        foreach (var evt in order.PullEvents())
        {
            await eventBus.PublishAsync(evt, ct);
        }

        // 6. Return
        return new CreateOrderOutput(order.Id, order.Total, order.Status);
    }
}

// Input
public record CreateOrderInput(Guid UserId, List<OrderItemInput> Items)
{
    public record OrderItemInput(string ProductId, int Quantity, double Price);
}

// Output
public record CreateOrderOutput(Guid OrderId, double Total, string Status);

// Errors
public class UserNotFoundException(Guid userId) : Exception($"User {userId} not found");
public class EmptyOrderException() : Exception("Order must contain at least one item");
```

### With ASP.NET Core Minimal API
```csharp
// Program.cs or endpoint registration
app.MapPost("/api/v1/orders", async (
    CreateOrderInput input,
    CreateOrderUseCase useCase,
    CancellationToken ct) =>
{
    var result = await useCase.ExecuteAsync(input, ct);
    return Results.Created($"/api/v1/orders/{result.OrderId}", result);
});
```

### Unit Test
```csharp
// tests/Unit/CreateOrderUseCaseTests.cs
namespace UnitTests;

using Application.UseCases;
using Domain.Entities;
using TestUtils;

public class CreateOrderUseCaseTests
{
    [Fact]
    public async Task Creates_Order_For_Existing_User()
    {
        var userRepo = new InMemoryUserRepository();
        var orderRepo = new InMemoryOrderRepository();
        var eventBus = new InMemoryEventBus();

        var user = User.Create("test@test.com", "Test User");
        await userRepo.SaveAsync(user);

        var uc = new CreateOrderUseCase(orderRepo, userRepo, eventBus);
        var result = await uc.ExecuteAsync(new CreateOrderInput(
            user.Id,
            [new CreateOrderInput.OrderItemInput("prod-1", 2, 10.0)]
        ));

        Assert.Equal(20.0, result.Total);
        Assert.Equal("pending", result.Status);
    }

    [Fact]
    public async Task Throws_When_User_Not_Found()
    {
        var uc = new CreateOrderUseCase(
            new InMemoryOrderRepository(),
            new InMemoryUserRepository(),
            new InMemoryEventBus()
        );

        await Assert.ThrowsAsync<UserNotFoundException>(() =>
            uc.ExecuteAsync(new CreateOrderInput(
                Guid.NewGuid(),
                [new CreateOrderInput.OrderItemInput("p1", 1, 10.0)]
            )));
    }
}
```

### Notes
- Primary constructor (C# 12) for clean dependency injection
- `sealed` class unless inheritance is needed
- Collection expression `[...]` (C# 12) for list literals
- `CancellationToken` as last parameter with default
