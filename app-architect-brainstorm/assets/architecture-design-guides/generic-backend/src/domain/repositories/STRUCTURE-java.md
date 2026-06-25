# Implementation: Repository Interface — Java

> **Design Structure Guide — java**
>
> This document shows how the Clean Architecture pattern maps to java syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```java
// src/domain/repositories/UserRepository.java
package domain.repositories;

import domain.entities.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository {
    Optional<User> findById(UUID id);
    Optional<User> findByEmail(String email);
    PaginatedResult<User> findAll(PaginationOptions options);
    User save(User user);
    void delete(UUID id);
    boolean exists(UUID id);
}
```

```java
// src/domain/repositories/PaginationOptions.java
package domain.repositories;

public record PaginationOptions(int page, int limit, String sortBy, SortOrder sortOrder) {
    public PaginationOptions {
        if (page < 1) page = 1;
        if (limit < 1) limit = 20;
    }

    public PaginationOptions(int page, int limit) {
        this(page, limit, null, SortOrder.DESC);
    }
}

enum SortOrder { ASC, DESC }
```

```java
// src/domain/repositories/PaginatedResult.java
package domain.repositories;

import java.util.List;

public record PaginatedResult<T>(
    List<T> items,
    long total,
    int page,
    int limit,
    int totalPages
) {}
```

### In-Memory Implementation (for unit tests)
```java
// tests/unit/InMemoryUserRepository.java
package testutil;

import domain.entities.User;
import domain.repositories.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class InMemoryUserRepository implements UserRepository {
    private final Map<UUID, User> users = new ConcurrentHashMap<>();

    @Override
    public Optional<User> findById(UUID id) {
        return Optional.ofNullable(users.get(id));
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return users.values().stream()
            .filter(u -> u.getEmail().equalsIgnoreCase(email))
            .findFirst();
    }

    @Override
    public PaginatedResult<User> findAll(PaginationOptions options) {
        var list = new ArrayList<>(users.values());
        int start = (options.page() - 1) * options.limit();
        int end = Math.min(start + options.limit(), list.size());
        var items = list.subList(start, end);
        int totalPages = (int) Math.ceil((double) list.size() / options.limit());
        return new PaginatedResult<>(items, list.size(), options.page(), options.limit(), totalPages);
    }

    @Override
    public User save(User user) {
        users.put(user.getId(), user);
        return user;
    }

    @Override
    public void delete(UUID id) {
        users.remove(id);
    }

    @Override
    public boolean exists(UUID id) {
        return users.containsKey(id);
    }
}
```

### Notes
- `Optional<T>` for possibly-empty returns (Java 8+)
- `record` for PaginationOptions and PaginatedResult (Java 16+)
- `ConcurrentHashMap` for thread-safe in-memory store
- Spring Data users: this interface is separate from `JpaRepository` — map between them in the adapter
