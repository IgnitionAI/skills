# Implementation: Repository Interface — Rust

> **Design Structure Guide — rust**
>
> This document shows how the Clean Architecture pattern maps to rust syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```rust
// src/domain/repositories/user_repository.rs
use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::entities::user::User;
use crate::domain::errors::RepositoryError;

#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, RepositoryError>;
    async fn find_by_email(&self, email: &str) -> Result<Option<User>, RepositoryError>;
    async fn find_all(&self, opts: &PaginationOptions) -> Result<PaginatedResult<User>, RepositoryError>;
    async fn save(&self, user: &User) -> Result<(), RepositoryError>;
    async fn delete(&self, id: Uuid) -> Result<(), RepositoryError>;
    async fn exists(&self, id: Uuid) -> Result<bool, RepositoryError>;
}

pub struct PaginationOptions {
    pub page: u32,
    pub limit: u32,
    pub sort_by: Option<String>,
    pub sort_order: SortOrder,
}

pub enum SortOrder {
    Asc,
    Desc,
}

pub struct PaginatedResult<T> {
    pub items: Vec<T>,
    pub total: u64,
    pub page: u32,
    pub limit: u32,
    pub total_pages: u32,
}

// Shared error type for all repositories
#[derive(Debug, thiserror::Error)]
pub enum RepositoryError {
    #[error("not found")]
    NotFound,
    #[error("duplicate key")]
    Duplicate,
    #[error("database error: {0}")]
    Database(String),
    #[error("connection error")]
    Connection,
}
```

### In-Memory Implementation (for unit tests)
```rust
// tests/unit/in_memory_user_repository.rs
use std::collections::HashMap;
use std::sync::Mutex;
use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::entities::user::User;
use crate::domain::repositories::user_repository::*;

pub struct InMemoryUserRepository {
    users: Mutex<HashMap<Uuid, User>>,
}

impl InMemoryUserRepository {
    pub fn new() -> Self {
        Self {
            users: Mutex::new(HashMap::new()),
        }
    }
}

#[async_trait]
impl UserRepository for InMemoryUserRepository {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, RepositoryError> {
        let users = self.users.lock().unwrap();
        Ok(users.get(&id).cloned())
    }

    async fn find_by_email(&self, email: &str) -> Result<Option<User>, RepositoryError> {
        let users = self.users.lock().unwrap();
        Ok(users.values().find(|u| u.email() == email).cloned())
    }

    async fn save(&self, user: &User) -> Result<(), RepositoryError> {
        let mut users = self.users.lock().unwrap();
        users.insert(user.id(), user.clone());
        Ok(())
    }

    async fn delete(&self, id: Uuid) -> Result<(), RepositoryError> {
        let mut users = self.users.lock().unwrap();
        users.remove(&id);
        Ok(())
    }

    async fn exists(&self, id: Uuid) -> Result<bool, RepositoryError> {
        let users = self.users.lock().unwrap();
        Ok(users.contains_key(&id))
    }
}
```

### Notes
- `async_trait` is required for async methods in traits
- `Send + Sync` bounds required for multi-threaded runtimes
- `RepositoryError` is shared across all repository implementations
- `Mutex<HashMap>` for in-memory store — `RwLock` if read-heavy
