# Implementation: Repository Interface — TypeScript

> **Design Structure Guide — typescript**
>
> This document shows how the Clean Architecture pattern maps to typescript syntax.
> It is a design reference for the architecture specification, not a copy-paste code template.
> The implementation team uses this as a structural guide when writing actual code.

```typescript
// src/domain/repositories/user-repository.ts
import { User } from '../entities/user';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(options: PaginationOptions): Promise<PaginatedResult<User>>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### Dependency Injection (NestJS)
```typescript
// Register in module:
{ provide: 'IUserRepository', useClass: UserPostgresRepository }

// Inject in use case:
constructor(@Inject('IUserRepository') private userRepo: IUserRepository) {}
```

### In-Memory Implementation (for unit tests)
```typescript
// tests/unit/in-memory-user-repository.ts
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.email === email) ?? null;
  }

  async findAll(options: PaginationOptions): Promise<PaginatedResult<User>> {
    const all = Array.from(this.users.values());
    const start = (options.page - 1) * options.limit;
    const items = all.slice(start, start + options.limit);
    return { items, total: all.length, page: options.page, limit: options.limit, totalPages: Math.ceil(all.length / options.limit) };
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.users.has(id);
  }
}
```
