# Implementation: Domain Entity — Rust

> **Design Structure Guide — rust**
>
> This document shows how the Clean Architecture pattern maps to rust syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```rust
// src/domain/entities/user.rs
use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::domain::value_objects::email::{Email, EmailError};
use crate::domain::events::DomainEvent;

#[derive(Debug, Clone)]
pub struct User {
    id: Uuid,
    email: Email,
    name: String,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    events: Vec<DomainEvent>,
}

#[derive(Debug, thiserror::Error)]
pub enum UserError {
    #[error("name must be at least 2 characters")]
    InvalidName,
    #[error("invalid email: {0}")]
    InvalidEmail(#[from] EmailError),
}

impl User {
    /// Creates a new user with validation.
    pub fn new(email: &str, name: &str) -> Result<Self, UserError> {
        if name.len() < 2 {
            return Err(UserError::InvalidName);
        }

        let now = Utc::now();
        Ok(Self {
            id: Uuid::new_v4(),
            email: Email::new(email)?,
            name: name.to_string(),
            created_at: now,
            updated_at: now,
            events: Vec::new(),
        })
    }

    /// Reconstitutes a user from database data.
    pub fn reconstitute(
        id: Uuid,
        email: &str,
        name: String,
        created_at: DateTime<Utc>,
        updated_at: DateTime<Utc>,
    ) -> Result<Self, UserError> {
        Ok(Self {
            id,
            email: Email::parse(email)?,
            name,
            created_at,
            updated_at,
            events: Vec::new(),
        })
    }

    /// Changes the user's name.
    pub fn change_name(&mut self, new_name: &str) -> Result<(), UserError> {
        if new_name.len() < 2 {
            return Err(UserError::InvalidName);
        }
        self.name = new_name.to_string();
        self.touch();
        Ok(())
    }

    // Getters
    pub fn id(&self) -> Uuid { self.id }
    pub fn email(&self) -> &str { self.email.value() }
    pub fn name(&self) -> &str { &self.name }
    pub fn created_at(&self) -> DateTime<Utc> { self.created_at }
    pub fn updated_at(&self) -> DateTime<Utc> { self.updated_at }

    /// Returns and clears pending domain events.
    pub fn pull_events(&mut self) -> Vec<DomainEvent> {
        std::mem::take(&mut self.events)
    }

    fn touch(&mut self) {
        self.updated_at = Utc::now();
    }
}
```

### Notes
- `thiserror` for ergonomic error types
- `std::mem::take` for efficiently clearing the events vec
- `DateTime<Utc>` from `chrono` crate
- `Uuid` from `uuid` crate
- Domain errors are enums with `thiserror::Error`
