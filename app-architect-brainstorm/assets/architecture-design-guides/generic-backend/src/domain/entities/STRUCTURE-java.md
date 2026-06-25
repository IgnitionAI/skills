# Implementation: Domain Entity — Java

> **Design Structure Guide — java**
>
> This document shows how the Clean Architecture pattern maps to java syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```java
// src/domain/entities/User.java
package domain.entities;

import domain.valueobjects.Email;
import domain.events.DomainEvent;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class User {
    private final UUID id;
    private Email email;
    private String name;
    private final Instant createdAt;
    private Instant updatedAt;
    private final List<DomainEvent> events = new ArrayList<>();

    private User(UUID id, Email email, String name, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static User create(String email, String name) {
        if (name == null || name.length() < 2) {
            throw new IllegalArgumentException("Name must be at least 2 characters");
        }
        var now = Instant.now();
        return new User(UUID.randomUUID(), new Email(email), name, now, now);
    }

    public static User reconstitute(UUID id, String email, String name, Instant createdAt, Instant updatedAt) {
        return new User(id, Email.reconstitute(email), name, createdAt, updatedAt);
    }

    public void changeName(String newName) {
        if (newName == null || newName.length() < 2) {
            throw new IllegalArgumentException("Name must be at least 2 characters");
        }
        this.name = newName;
        this.touch();
    }

    public List<DomainEvent> pullEvents() {
        var pulled = new ArrayList<>(events);
        events.clear();
        return pulled;
    }

    // Getters
    public UUID getId() { return id; }
    public String getEmail() { return email.getValue(); }
    public String getName() { return name; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    private void touch() {
        this.updatedAt = Instant.now();
    }
}
```

### Notes
- Private constructor + static factory methods
- `var` for local variables (Java 10+)
- `Instant` for timestamps (prefer over `Date`/`Calendar`)
- No Lombok in domain — explicit code for clarity
- `IllegalArgumentException` for validation failures
