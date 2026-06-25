# Implementation: HTTP Handler — Go (Gin)

> **Design Structure Guide — go**
>
> This document shows how the Clean Architecture pattern maps to go syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```go
// src/interface/http/order_handler.go
package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"project/application/usecases"
)

// Request/Response schemas
type CreateOrderRequest struct {
	UserID string                `json:"user_id" binding:"required,uuid"`
	Items  []CreateOrderItemReq  `json:"items" binding:"required,min=1,dive"`
}

type CreateOrderItemReq struct {
	ProductID string  `json:"product_id" binding:"required"`
	Quantity  int     `json:"quantity" binding:"required,min=1"`
	Price     float64 `json:"price" binding:"required,min=0"`
}

type OrderResponse struct {
	OrderID string  `json:"order_id"`
	Total   float64 `json:"total"`
	Status  string  `json:"status"`
}

// OrderHandler handles HTTP requests for orders.
type OrderHandler struct {
	createUC *usecases.CreateOrderUseCase
	getUC    *usecases.GetOrderUseCase
}

// NewOrderHandler creates a new handler.
func NewOrderHandler(createUC *usecases.CreateOrderUseCase, getUC *usecases.GetOrderUseCase) *OrderHandler {
	return &OrderHandler{createUC: createUC, getUC: getUC}
}

// RegisterRoutes registers the order routes.
func (h *OrderHandler) RegisterRoutes(r *gin.RouterGroup) {
	orders := r.Group("/api/v1/orders")
	orders.POST("", h.create)
	orders.GET("/:id", h.getByID)
}

func (h *OrderHandler) create(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION", "details": err.Error()})
		return
	}

	input := usecases.CreateOrderInput{
		UserID: req.UserID,
		Items: make([]usecases.OrderItemInput, len(req.Items)),
	}
	for i, item := range req.Items {
		input.Items[i] = usecases.OrderItemInput{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     item.Price,
		}
	}

	result, err := h.createUC.Execute(c.Request.Context(), input)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusCreated, OrderResponse{
		OrderID: result.OrderID,
		Total:   result.Total,
		Status:  result.Status,
	})
}

func (h *OrderHandler) getByID(c *gin.Context) {
	id := c.Param("id")
	result, err := h.getUC.Execute(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}
	if result == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND", "message": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, OrderResponse{
		OrderID: result.OrderID,
		Total:   result.Total,
		Status:  result.Status,
	})
}

// handleError maps domain errors to HTTP responses.
func handleError(c *gin.Context, err error) {
	code := "INTERNAL"
	status := http.StatusInternalServerError

	switch {
	case errors.Is(err, usecases.ErrUserNotFound):
		code, status = "NOT_FOUND", http.StatusNotFound
	case errors.Is(err, usecases.ErrEmptyOrder):
		code, status = "DOMAIN_ERROR", http.StatusUnprocessableEntity
	}

	c.JSON(status, gin.H{"error": code, "message": err.Error()})
}
```

### Router Setup
```go
// src/main.go
package main

import (
	"github.com/gin-gonic/gin"
	"project/application/usecases"
	httphandlers "project/interface/http"
)

func main() {
	r := gin.Default()

	// Setup handlers
	orderHandler := httphandlers.NewOrderHandler(
		usecases.NewCreateOrderUseCase(orderRepo, userRepo, eventBus),
		usecases.NewGetOrderUseCase(orderRepo),
	)
	orderHandler.RegisterRoutes(r)

	r.Run(":8080")
}
```

### Notes
- Gin's `binding` tags for request validation
- `ShouldBindJSON` returns 400 automatically on validation failure
- `errors.Is()` for error type checking (Go 1.13+)
