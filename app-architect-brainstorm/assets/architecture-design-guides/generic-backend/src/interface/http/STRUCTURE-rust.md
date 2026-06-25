# Implementation: HTTP Handler — Rust (Axum)

> **Design Structure Guide — rust**
>
> This document shows how the Clean Architecture pattern maps to rust syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```rust
// src/interface/http/order_handler.rs
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::application::use_cases::create_order::{
    CreateOrderError, CreateOrderInput, CreateOrderOutput, CreateOrderUseCase,
    OrderItemInput,
};
use crate::AppState;

// Request/Response schemas
#[derive(Debug, Deserialize)]
struct CreateOrderRequest {
    user_id: Uuid,
    #[serde(rename = "items")]
    items: Vec<OrderItemReq>,
}

#[derive(Debug, Deserialize)]
struct OrderItemReq {
    product_id: String,
    quantity: u32,
    price: f64,
}

#[derive(Debug, Serialize)]
struct OrderResponse {
    order_id: Uuid,
    total: f64,
    status: String,
}

// Error response
#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
}

pub fn order_routes() -> Router<AppState> {
    Router::new()
        .route("/api/v1/orders", post(create_order))
        .route("/api/v1/orders/:id", get(get_order))
}

async fn create_order(
    State(state): State<AppState>,
    Json(req): Json<CreateOrderRequest>,
) -> Result<impl IntoResponse, AppError> {
    let items = req.items.into_iter()
        .map(|i| OrderItemInput { product_id: i.product_id, quantity: i.quantity, price: i.price })
        .collect();

    let result = state.create_order_uc.execute(CreateOrderInput {
        user_id: req.user_id,
        items,
    }).await?;

    Ok((
        StatusCode::CREATED,
        Json(OrderResponse {
            order_id: result.order_id,
            total: result.total,
            status: result.status,
        }),
    ))
}

async fn get_order(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let result = state.get_order_uc.execute(id).await?;
    match result {
        Some(order) => Ok((
            StatusCode::OK,
            Json(OrderResponse {
                order_id: order.id,
                total: order.total,
                status: order.status,
            }),
        )),
        None => Err(AppError::NotFound),
    }
}

// Error handling
#[derive(Debug)]
pub enum AppError {
    UseCase(CreateOrderError),
    NotFound,
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, error, message) = match self {
            AppError::UseCase(CreateOrderError::UserNotFound) => {
                (StatusCode::NOT_FOUND, "NOT_FOUND", "User not found")
            }
            AppError::UseCase(CreateOrderError::EmptyOrder) => {
                (StatusCode::UNPROCESSABLE_ENTITY, "DOMAIN_ERROR", "Order must contain at least one item")
            }
            AppError::NotFound => {
                (StatusCode::NOT_FOUND, "NOT_FOUND", "Order not found")
            }
            _ => (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Internal server error"),
        };

        (status, Json(ErrorResponse {
            error: error.to_string(),
            message: message.to_string(),
        })).into_response()
    }
}

impl From<CreateOrderError> for AppError {
    fn from(err: CreateOrderError) -> Self {
        AppError::UseCase(err)
    }
}
```

### Router Setup
```rust
// src/main.rs
use axum::Router;

#[derive(Clone)]
struct AppState {
    create_order_uc: Arc<CreateOrderUseCase>,
    get_order_uc: Arc<GetOrderUseCase>,
}

#[tokio::main]
async fn main() {
    let state = AppState {
        create_order_uc: Arc::new(CreateOrderUseCase::new(...)),
        get_order_uc: Arc::new(GetOrderUseCase::new(...)),
    };

    let app = Router::new()
        .merge(order_routes())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

### Notes
- `Result<impl IntoResponse, AppError>` is the Axum pattern
- `IntoResponse` trait for custom error responses
- `AppState` holds all use cases (Arc for shared ownership)
- `?` operator auto-converts errors via `From` trait
