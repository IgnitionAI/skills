# Implementation: HTTP Handler — C# (ASP.NET Core)

> **Design Structure Guide — csharp**
>
> This document shows how the Clean Architecture pattern maps to csharp syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```csharp
// src/Interface/Http/OrdersController.cs
namespace Interface.Http;

using Application.UseCases;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/[controller]")]
public class OrdersController(
    CreateOrderUseCase createOrderUC,
    GetOrderUseCase getOrderUC) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(CreateOrderOutput), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequestDto dto, CancellationToken ct)
    {
        var result = await createOrderUC.ExecuteAsync(dto.ToInput(), ct);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.OrderId },
            result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OrderOutput), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await getOrderUC.ExecuteAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }
}

// Request DTO
public record CreateOrderRequestDto(
    Guid UserId,
    List<OrderItemDto> Items
)
{
    public record OrderItemDto(string ProductId, int Quantity, double Price);

    public CreateOrderInput ToInput() => new(
        UserId,
        Items.Select(i => new CreateOrderInput.OrderItemInput(i.ProductId, i.Quantity, i.Price)).ToList()
    );
}

// Error response
public record ErrorResponse(string Error, string Message);
```

### Minimal API Style (Alternative)
```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);
// ... services

var app = builder.Build();

// Order endpoints
app.MapPost("/api/v1/orders", async (
    CreateOrderInput input,
    CreateOrderUseCase useCase,
    CancellationToken ct) =>
{
    try
    {
        var result = await useCase.ExecuteAsync(input, ct);
        return Results.Created($"/api/v1/orders/{result.OrderId}", result);
    }
    catch (UserNotFoundException)
    {
        return Results.NotFound(new ErrorResponse("NOT_FOUND", "User not found"));
    }
    catch (EmptyOrderException ex)
    {
        return Results.UnprocessableEntity(new ErrorResponse("DOMAIN_ERROR", ex.Message));
    }
});

app.MapGet("/api/v1/orders/{id:guid}", async (Guid id, GetOrderUseCase useCase, CancellationToken ct) =>
{
    var result = await useCase.ExecuteAsync(id, ct);
    return result is null ? Results.NotFound() : Results.Ok(result);
});

app.Run();
```

### Global Error Handler
```csharp
// src/Interface/Http/GlobalExceptionHandler.cs
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Interface.Http;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken ct)
    {
        var (status, code) = MapError(exception);

        logger.LogError(exception, "Unhandled exception: {ErrorCode}", code);

        httpContext.Response.StatusCode = status;
        await httpContext.Response.WriteAsJsonAsync(
            new ErrorResponse(code, exception.Message), ct);

        return true;
    }

    private static (int Status, string Code) MapError(Exception ex) => ex switch
    {
        UserNotFoundException => (StatusCodes.Status404NotFound, "NOT_FOUND"),
        EmptyOrderException => (StatusCodes.Status422UnprocessableEntity, "DOMAIN_ERROR"),
        _ => (StatusCodes.Status500InternalServerError, "INTERNAL")
    };
}

// Register in Program.cs:
// builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
// builder.Services.AddProblemDetails();
// app.UseExceptionHandler();
```

### Notes
- Primary constructor for controllers (C# 12)
- `Results.Xxx()` for Minimal API responses
- `IExceptionHandler` (ASP.NET Core 8+) for global error handling
- `ProducesResponseType` for OpenAPI/Swagger documentation
- `: guid` route constraint for type-safe GUID binding
