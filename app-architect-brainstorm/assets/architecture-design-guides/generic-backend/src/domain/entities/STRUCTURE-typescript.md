# Implementation: Domain Entity — TypeScript

> **Design Structure Guide — typescript**
>
> This document shows how the Clean Architecture pattern maps to typescript syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```typescript
// src/domain/entities/user.ts
import { Email } from '../value-objects/email';
import { DomainEvent } from '../events/domain-event';

export class User {
  private _events: DomainEvent[] = [];

  private constructor(
    private readonly _id: string,
    private _email: Email,
    private _name: string,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // Factory: create new entity (validates)
  static create(email: string, name: string): User {
    if (!name || name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    const now = new Date();
    return new User(
      crypto.randomUUID(),
      Email.create(email),
      name,
      now,
      now,
    );
  }

  // Factory: reconstitute from database (trusts data)
  static reconstitute(
    id: string,
    email: string,
    name: string,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    return new User(id, Email.reconstitute(email), name, createdAt, updatedAt);
  }

  // Business method (not a setter!)
  changeName(newName: string): void {
    if (!newName || newName.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    this._name = newName;
    this.touch();
  }

  // Domain event emission
  private touch(): void {
    this._updatedAt = new Date();
  }

  pullEvents(): DomainEvent[] {
    const events = this._events;
    this._events = [];
    return events;
  }

  // Getters (read-only access)
  get id(): string { return this._id; }
  get email(): string { return this._email.value; }
  get name(): string { return this._name; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
}
```

### Notes
- Use `#privateField` (ES2022) or `private` keyword
- `crypto.randomUUID()` requires Node 19+; use `uuid` package for older versions
- `DomainEvent` is a base class/interface defined in `src/domain/events/`
