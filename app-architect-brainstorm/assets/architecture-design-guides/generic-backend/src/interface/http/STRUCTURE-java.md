# Implementation: HTTP Handler — Java (Spring Boot)

> **Design Structure Guide — java**
>
> This document shows how the Clean Architecture pattern maps to java syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```java
// src/interface/http/OrderController.java
package interface.http;

import application.usecases.CreateOrderUseCase;
import application.usecases.CreateOrderUseCase.CreateOrderInput;
import application.usecases.CreateOrderUseCase.CreateOrderOutput;
import application.usecases.GetOrderUseCase;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final CreateOrderUseCase createOrderUC;
    private final GetOrderUseCase getOrderUC;

    @PostMapping
    public ResponseEntity<ApiResponse<CreateOrderOutput>> create(
            @Valid @RequestBody CreateOrderRequestDto dto) {
        var result = createOrderUC.execute(new CreateOrderInput(
            dto.userId(),
            dto.items().stream()
                .map(i -> new CreateOrderInput.OrderItemInput(i.productId(), i.quantity(), i.price()))
                .toList()
        ));
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderOutput>> getById(@PathVariable UUID id) {
        var result = getOrderUC.execute(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // Request DTO
    public record CreateOrderRequestDto(
        @NotNull UUID userId,
        @NotEmpty List<@Valid OrderItemDto> items
    ) {
        public record OrderItemDto(
            @NotBlank String productId,
            @Min(1) int quantity,
            @Min(0) double price
        ) {}
    }
}

// Response envelope
record ApiResponse<T>(T data, String status) {
    static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data, "success");
    }
}
```

### Global Error Handler
```java
// src/interface/http/GlobalExceptionHandler.java
package interface.http;

import application.usecases.CreateOrderUseCase.UserNotFoundException;
import application.usecases.CreateOrderUseCase.EmptyOrderException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(UserNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
    }

    @ExceptionHandler(EmptyOrderException.class)
    public ResponseEntity<Map<String, String>> handleDomain(EmptyOrderException e) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(Map.of("error", "DOMAIN_ERROR", "message", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", "INTERNAL", "message", "An unexpected error occurred"));
    }
}
```

### Notes
- `@Valid` triggers Jakarta Validation (bean validation)
- `record` for DTOs (Java 16+)
- `@RestControllerAdvice` for global error handling
- `ResponseEntity` for full control over status codes and headers
