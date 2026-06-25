# Implementation: Use Case — Go

> **Design Structure Guide — go**
>
> This document shows how the Clean Architecture pattern maps to go syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```go
// src/application/usecases/create_order.go
package usecases

import (
	"context"
	"fmt"

	"project/domain"
)

// CreateOrderInput represents the use case input.
type CreateOrderInput struct {
	UserID string
	Items  []OrderItemInput
}

type OrderItemInput struct {
	ProductID string
	Quantity  int
	Price     float64
}

// CreateOrderOutput represents the use case output.
type CreateOrderOutput struct {
	OrderID string
	Total   float64
	Status  string
}

// Errors
var (
	ErrUserNotFound = fmt.Errorf("user not found")
	ErrEmptyOrder   = fmt.Errorf("order must contain at least one item")
)

// CreateOrderUseCase creates a new order.
type CreateOrderUseCase struct {
	orderRepo domain.OrderRepository
	userRepo  domain.UserRepository
	eventBus  domain.EventBus
}

// NewCreateOrderUseCase creates a new use case instance.
func NewCreateOrderUseCase(
	orderRepo domain.OrderRepository,
	userRepo domain.UserRepository,
	eventBus domain.EventBus,
) *CreateOrderUseCase {
	return &CreateOrderUseCase{
		orderRepo: orderRepo,
		userRepo:  userRepo,
		eventBus:  eventBus,
	}
}

// Execute runs the use case.
func (uc *CreateOrderUseCase) Execute(ctx context.Context, input CreateOrderInput) (*CreateOrderOutput, error) {
	// 1. Fetch user
	userID, err := uuid.Parse(input.UserID)
	if err != nil {
		return nil, fmt.Errorf("invalid user id: %w", err)
	}

	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("fetch user: %w", err)
	}
	if user == nil {
		return nil, ErrUserNotFound
	}

	// 2. Validate
	if len(input.Items) == 0 {
		return nil, ErrEmptyOrder
	}

	// 3. Domain logic
	items := make([]domain.OrderItem, len(input.Items))
	for i, item := range input.Items {
		items[i] = domain.OrderItem{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     item.Price,
		}
	}

	order, err := domain.NewOrder(user.ID(), items)
	if err != nil {
		return nil, fmt.Errorf("create order: %w", err)
	}

	// 4. Save
	if err := uc.orderRepo.Save(ctx, order); err != nil {
		return nil, fmt.Errorf("save order: %w", err)
	}

	// 5. Publish events
	for _, event := range order.PullEvents() {
		if err := uc.eventBus.Publish(ctx, event); err != nil {
			// Log but don't fail — event publishing can be retried
			// logger.Warn("failed to publish event", "error", err)
		}
	}

	// 6. Return
	return &CreateOrderOutput{
		OrderID: order.ID().String(),
		Total:   order.Total(),
		Status:  order.Status(),
	}, nil
}
```

### Unit Test
```go
// tests/unit/create_order_test.go
package unit

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"project/application/usecases"
	"project/domain"
	"project/tests/testutil"
)

func TestCreateOrder_Success(t *testing.T) {
	ctx := context.Background()
	userRepo := testutil.NewInMemoryUserRepository()
	orderRepo := testutil.NewInMemoryOrderRepository()
	eventBus := testutil.NewInMemoryEventBus()

	// Seed user
	user, _ := domain.NewUser("test@test.com", "Test User")
	require.NoError(t, userRepo.Save(ctx, user))

	uc := usecases.NewCreateOrderUseCase(orderRepo, userRepo, eventBus)
	result, err := uc.Execute(ctx, usecases.CreateOrderInput{
		UserID: user.ID().String(),
		Items: []usecases.OrderItemInput{
			{ProductID: "prod-1", Quantity: 2, Price: 10.0},
		},
	})

	require.NoError(t, err)
	assert.Equal(t, 20.0, result.Total)
	assert.Equal(t, "pending", result.Status)
	assert.NotEmpty(t, result.OrderID)
}

func TestCreateOrder_UserNotFound(t *testing.T) {
	ctx := context.Background()
	uc := usecases.NewCreateOrderUseCase(
		testutil.NewInMemoryOrderRepository(),
		testutil.NewInMemoryUserRepository(),
		testutil.NewInMemoryEventBus(),
	)

	_, err := uc.Execute(ctx, usecases.CreateOrderInput{
		UserID: uuid.New().String(),
		Items:  []usecases.OrderItemInput{{ProductID: "p1", Quantity: 1, Price: 10}},
	})

	assert.ErrorIs(t, err, usecases.ErrUserNotFound)
}
```
