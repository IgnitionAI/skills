# Implementation: Domain Entity — C#

> **Design Structure Guide — csharp**
>
> This document shows how the Clean Architecture pattern maps to csharp syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```csharp
// src/Domain/Entities/User.cs
namespace Domain.Entities;

using Domain.ValueObjects;
using Domain.Events;

public class User
{
    private readonly List<DomainEvent> _events = new();

    public Guid Id { get; }
    public Email Email { get; private set; }
    public string Name { get; private set; }
    public DateTime CreatedAt { get; }
    public DateTime UpdatedAt { get; private set; }

    private User(Guid id, Email email, string name, DateTime createdAt, DateTime updatedAt)
    {
        Id = id;
        Email = email;
        Name = name;
        CreatedAt = createdAt;
        UpdatedAt = updatedAt;
    }

    public static User Create(string email, string name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length < 2)
            throw new ArgumentException("Name must be at least 2 characters", nameof(name));

        var now = DateTime.UtcNow;
        return new User(Guid.NewGuid(), new Email(email), name, now, now);
    }

    public static User Reconstitute(Guid id, string email, string name, DateTime createdAt, DateTime updatedAt)
    {
        return new User(id, Email.Reconstitute(email), name, createdAt, updatedAt);
    }

    public void ChangeName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName) || newName.Length < 2)
            throw new ArgumentException("Name must be at least 2 characters", nameof(newName));

        Name = newName;
        Touch();
    }

    public IReadOnlyList<DomainEvent> PullEvents()
    {
        var events = _events.ToList();
        _events.Clear();
        return events;
    }

    private void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}
```

### Notes
- Private constructor + static factory methods
- `DateTime.UtcNow` for timestamps (always UTC in backend)
- `IReadOnlyList<T>` for exposing collections defensively
- Primary constructors (C# 12) can be used for simpler cases
- Records are NOT recommended for entities — reference equality matters
