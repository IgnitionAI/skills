# Implementation: Use Case — Rust

> **Design Structure Guide — rust**
>
> This document shows how the Clean Architecture pattern maps to rust syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```rust
// src/application/use_cases/create_order.rs
use uuid::Uuid;

use crate::domain::entities::order::{Order, OrderItem};
use crate::domain::repositories::order_repository::OrderRepository;
use crate::domain::repositories::user_repository::UserRepository;
use crate::domain::events::EventBus;
use crate::domain::errors::{DomainError, RepositoryError};

pub struct CreateOrderInput {
    pub user_id: Uuid,
    pub items: Vec<OrderItemInput>,
}

pub struct OrderItemInput {
    pub product_id: String,
    pub quantity: u32,
    pub price: f64,
}

pub struct CreateOrderOutput {
    pub order_id: Uuid,
    pub total: f64,
    pub status: String,
}

#[derive(Debug, thiserror::Error)]
pub enum CreateOrderError {
    #[error("user not found")]
    UserNotFound,
    #[error("order must contain at least one item")]
    EmptyOrder,
    #[error("domain error: {0}")]
    Domain(#[from] DomainError),
    #[error("repository error: {0}")]
    Repository(#[from] RepositoryError),
}

pub struct CreateOrderUseCase {
    order_repo: Box<dyn OrderRepository>,
    user_repo: Box<dyn UserRepository>,
    event_bus: Box<dyn EventBus>,
}

impl CreateOrderUseCase {
    pub fn new(
        order_repo: Box<dyn OrderRepository>,
        user_repo: Box<dyn UserRepository>,
        event_bus: Box<dyn EventBus>,
    ) -> Self {
        Self { order_repo, user_repo, event_bus }
    }

    pub async fn execute(&self, input: CreateOrderInput) -> Result<CreateOrderOutput, CreateOrderError> {
        // 1. Fetch user
        let user = self.user_repo.find_by_id(input.user_id).await?
            .ok_or(CreateOrderError::UserNotFound)?;

        // 2. Validate
        if input.items.is_empty() {
            return Err(CreateOrderError::EmptyOrder);
        }

        // 3. Domain logic
        let items: Vec<OrderItem> = input.items.into_iter()
            .map(|i| OrderItem { product_id: i.product_id, quantity: i.quantity, price: i.price })
            .collect();

        let mut order = Order::new(user.id(), items)?;

        // 4. Save
        self.order_repo.save(&order).await?;

        // 5. Publish events
        for event in order.pull_events() {
            let _ = self.event_bus.publish(event).await; // Don't fail on event publish
        }

        // 6. Return
        Ok(CreateOrderOutput {
            order_id: order.id(),
            total: order.total(),
            status: order.status().to_string(),
        })
    }
}
```

### Unit Test
```rust
// tests/unit/create_order_test.rs
use uuid::Uuid;

use crate::application::use_cases::create_order::*;
use crate::tests::testutil::*;

#[tokio::test]
async fn test_create_order_success() {
    let user_repo = Box::new(InMemoryUserRepository::new());
    let order_repo = Box::new(InMemoryOrderRepository::new());
    let event_bus = Box::new(InMemoryEventBus::new());

    // Seed user
    let user = User::new("test@test.com", "Test User").unwrap();
    user_repo.save(&user).await.unwrap();

    let uc = CreateOrderUseCase::new(order_repo, user_repo, event_bus);
    let result = uc.execute(CreateOrderInput {
        user_id: user.id(),
        items: vec![OrderItemInput { product_id: "prod-1".to_string(), quantity: 2, price: 10.0 }],
    }).await.unwrap();

    assert_eq!(result.total, 20.0);
    assert_eq!(result.status, "pending");
}

#[tokio::test]
async fn test_create_order_user_not_found() {
    let uc = CreateOrderUseCase::new(
        Box::new(InMemoryOrderRepository::new()),
        Box::new(InMemoryUserRepository::new()),
        Box::new(InMemoryEventBus::new()),
    );

    let result = uc.execute(CreateOrderInput {
        user_id: Uuid::new_v4(),
        items: vec![OrderItemInput { product_id: "p1".to_string(), quantity: 1, price: 10.0 }],
    }).await;

    assert!(matches!(result, Err(CreateOrderError::UserNotFound)));
}
```
