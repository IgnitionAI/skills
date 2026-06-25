# Implementation: Repository Interface — C#

> **Design Structure Guide — csharp**
>
> This document shows how the Clean Architecture pattern maps to csharp syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```csharp
// src/Domain/Repositories/IUserRepository.cs
namespace Domain.Repositories;

using Domain.Entities;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<PaginatedResult<User>> ListAsync(PaginationOptions options, CancellationToken ct = default);
    Task SaveAsync(User user, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken ct = default);
}

// src/Domain/Repositories/PaginationOptions.cs
namespace Domain.Repositories;

public record PaginationOptions(
    int Page = 1,
    int Limit = 20,
    string? SortBy = null,
    SortOrder SortOrder = SortOrder.Desc
);

public enum SortOrder { Asc, Desc }

// src/Domain/Repositories/PaginatedResult.cs
namespace Domain.Repositories;

public record PaginatedResult<T>(
    IReadOnlyList<T> Items,
    long Total,
    int Page,
    int Limit,
    int TotalPages
);
```

### In-Memory Implementation (for unit tests)
```csharp
// tests/Unit/InMemoryUserRepository.cs
namespace TestUtils;

using Domain.Entities;
using Domain.Repositories;

public class InMemoryUserRepository : IUserRepository
{
    private readonly Dictionary<Guid, User> _users = new();

    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        _users.TryGetValue(id, out var user);
        return Task.FromResult(user);
    }

    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        var user = _users.Values.FirstOrDefault(u =>
            u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(user);
    }

    public Task<PaginatedResult<User>> ListAsync(PaginationOptions options, CancellationToken ct = default)
    {
        var all = _users.Values.ToList();
        var skip = (options.Page - 1) * options.Limit;
        var items = all.Skip(skip).Take(options.Limit).ToList();
        var totalPages = (int)Math.Ceiling((double)all.Count / options.Limit);
        return Task.FromResult(new PaginatedResult<User>(items, all.Count, options.Page, options.Limit, totalPages));
    }

    public Task SaveAsync(User user, CancellationToken ct = default)
    {
        _users[user.Id] = user;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        _users.Remove(id);
        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(Guid id, CancellationToken ct = default)
    {
        return Task.FromResult(_users.ContainsKey(id));
    }
}
```

### Notes
- `IUserRepository` prefix `I` is C# convention
- `CancellationToken` as last parameter with default (C# async best practice)
- `Task.FromResult()` for synchronous in-memory implementations
- `IReadOnlyList<T>` for returning collections defensively
