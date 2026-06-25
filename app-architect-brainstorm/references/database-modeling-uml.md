# Database Modeling & UML Diagrams Reference

## Table of Contents
1. [Mermaid ER Diagram Syntax](#mermaid-syntax)
2. [Relationship Cardinality](#cardinality)
3. [Advanced Patterns](#advanced-patterns)
4. [Database-Specific Types](#db-types)
5. [Normalization Guide](#normalization)
6. [Common Schema Patterns](#schema-patterns)

---

## Mermaid Syntax

Mermaid ER diagrams use `erDiagram` blocks. Full syntax:

```mermaid
erDiagram
    ENTITY_A cardinality "label" cardinality ENTITY_B : relationship
```

### Cardinality Symbols

| Symbol | Meaning |
|--------|---------|
| `\|\|` | Exactly one |
| `\|o` | One or zero |
| `}o` | Zero or many |
| `}\|` | One or many |

### Entity Definition

```mermaid
erDiagram
    CUSTOMER {
        uuid id PK
        string email UK "Unique, indexed"
        string first_name
        string last_name
        enum status "active|inactive|banned"
        datetime created_at
        datetime updated_at "Nullable"
        datetime deleted_at "Soft delete"
    }
```

### Relationship Examples

```mermaid
erDiagram
    USER ||--o{ POST : "creates"
    POST ||--o{ COMMENT : "has"
    USER ||--o{ COMMENT : "writes"
    POST }o--o{ TAG : "categorized_by"
    USER ||--|| PROFILE : "has"
```

### Style Customization (Mermaid 10+)

```mermaid
erDiagram
    USER {
        uuid id PK
    }
    style USER fill:#e1f5e1,stroke:#2e7d32
```

---

## Advanced Patterns

### 1. Table Inheritance (Single Table vs Class Table)

**Single Table Inheritance** (when subtypes share most fields):
```mermaid
erDiagram
    USER {
        uuid id PK
        string type "admin|customer|vendor"
        string email
        string admin_level "Nullable"
        string company_name "Nullable"
        string tax_id "Nullable"
    }
```

**Class Table Inheritance** (when subtypes have distinct fields):
```mermaid
erDiagram
    USER {
        uuid id PK
        string email
        string type
    }
    ADMIN {
        uuid user_id PK,FK
        int admin_level
        datetime last_login_at
    }
    CUSTOMER {
        uuid user_id PK,FK
        string company_name
        string tax_id
    }
    USER ||--|| ADMIN : "is a"
    USER ||--|| CUSTOMER : "is a"
```

### 2. Soft Deletes

Always include `deleted_at` for business entities:
```mermaid
erDiagram
    PRODUCT {
        uuid id PK
        string name
        datetime deleted_at "Index for soft delete queries"
    }
```

Query pattern: `WHERE deleted_at IS NULL` (or use partial indexes).

### 3. Multi-Tenancy

**Shared Database, Schema per Tenant**:
```mermaid
erDiagram
    TENANT {
        uuid id PK
        string schema_name UK
        string domain
    }
    %% Each tenant has own schema with same tables
```

**Shared Database, Shared Tables** (tenant_id column):
```mermaid
erDiagram
    ORDERS {
        uuid id PK
        uuid tenant_id PK,FK
        uuid customer_id
        decimal amount
    }
    TENANT ||--|{ ORDERS : "owns"
```

### 4. Audit Trail

```mermaid
erDiagram
    PRODUCT {
        uuid id PK
        string name
        decimal price
    }
    PRODUCT_AUDIT {
        bigint id PK
        uuid product_id FK
        jsonb old_values
        jsonb new_values
        string action "INSERT|UPDATE|DELETE"
        uuid changed_by FK
        datetime changed_at
    }
    PRODUCT ||--o{ PRODUCT_AUDIT : "audited"
```

### 5. Many-to-Many with Payload

```mermaid
erDiagram
    STUDENT {
        uuid id PK
        string name
    }
    COURSE {
        uuid id PK
        string title
    }
    ENROLLMENT {
        uuid student_id PK,FK
        uuid course_id PK,FK
        datetime enrolled_at
        enum status "active|completed|dropped"
        decimal grade "Nullable"
    }
    STUDENT ||--o{ ENROLLMENT : "enrolled"
    COURSE ||--o{ ENROLLMENT : "has"
```

### 6. Self-Referencing Relationships

```mermaid
erDiagram
    EMPLOYEE {
        uuid id PK
        string name
        uuid manager_id FK "Self-reference"
    }
    EMPLOYEE ||--o{ EMPLOYEE : "manages"
```

### 7. Polymorphic Associations (Content Tagging)

```mermaid
erDiagram
    TAG {
        uuid id PK
        string name UK
    }
    TAGGABLE {
        uuid id PK
        uuid tag_id FK
        uuid taggable_id "Polymorphic FK"
        string taggable_type "table name"
    }
    ARTICLE {
        uuid id PK
        string title
    }
    VIDEO {
        uuid id PK
        string title
    }
    TAG ||--o{ TAGGABLE : "applied to"
```

---

## DB Types by Engine

### PostgreSQL

| Concept | Type |
|---------|------|
| UUID | `uuid` (use `gen_random_uuid()`) |
| JSON | `jsonb` (indexed with GIN) |
| Arrays | `text[]`, `int[]` |
| Enum | `CREATE TYPE status AS ENUM (...)` |
| Money | `decimal(19,4)` (never `money` type) |
| Full-text | `tsvector` + `tsquery` |
| Range | `daterange`, `int4range` |
| Geographic | `geometry(Point,4326)` (PostGIS) |

### MySQL

| Concept | Type |
|---------|------|
| UUID | `binary(16)` (convert from char) |
| JSON | `JSON` (5.7+) |
| Enum | `ENUM(...)` |
| Money | `decimal(19,4)` |
| Full-text | `FULLTEXT INDEX` on `InnoDB` |

### MongoDB

| Pattern | Approach |
|---------|----------|
| References | `DBRef` or manual refs |
| Embedded | Subdocuments for 1:few |
| Array of refs | For 1:many read-heavy |
| Polymorphic | `discriminatorKey` in Mongoose |

---

## Normalization Guide

### 1NF: Atomic Values
- No repeating groups
- Each cell contains single value
- **Violation**: `tags: "red,blue,green"` → Fix: Separate table or array type

### 2NF: No Partial Dependencies
- All non-key attributes depend on the FULL primary key
- **Violation**: In a composite PK `(order_id, product_id)`, `product_name` depends only on `product_id`

### 3NF: No Transitive Dependencies
- No non-key attribute depends on another non-key attribute
- **Violation**: `employee` table has `department_name` (depends on `department_id` which is FK)

### Denormalization Justifications
Acceptable when:
- Read-heavy, write-rarely (materialized views)
- Pre-computed aggregates for reporting
- Performance measured and proven (not assumed)
- Data duplication bounded and documented

---

## Common Schema Patterns

### E-Commerce
```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER ||--|| CART : has
    CUSTOMER {
        uuid id PK
        string email UK
        string password_hash
    }
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        uuid id PK
        uuid customer_id FK
        enum status
        decimal total
        datetime created_at
    }
    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal price_at_time
    }
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    PRODUCT {
        uuid id PK
        string name
        decimal price
        int stock_quantity
    }
    CART ||--o{ CART_ITEM : contains
    CART_ITEM {
        uuid id PK
        uuid cart_id FK
        uuid product_id FK
        int quantity
    }
```

### SaaS with Workspaces/Teams
```mermaid
erDiagram
    USER ||--o{ MEMBERSHIP : "belongs to"
    WORKSPACE ||--o{ MEMBERSHIP : has
    USER ||--o{ PROJECT : creates
    WORKSPACE ||--o{ PROJECT : contains
    USER {
        uuid id PK
        string email UK
    }
    WORKSPACE {
        uuid id PK
        string name
        uuid owner_id FK
    }
    MEMBERSHIP {
        uuid user_id PK,FK
        uuid workspace_id PK,FK
        enum role "owner|admin|member"
        datetime joined_at
    }
    PROJECT {
        uuid id PK
        uuid workspace_id FK
        uuid created_by FK
        string name
    }
```

### Social/Media Platform
```mermaid
erDiagram
    USER ||--o{ POST : creates
    USER ||--o{ FOLLOW : follows
    USER ||--o{ FOLLOW : "is followed by"
    POST ||--o{ LIKE : has
    POST ||--o{ COMMENT : has
    USER ||--o{ LIKE : gives
    USER ||--o{ COMMENT : writes
    POST {
        uuid id PK
        uuid author_id FK
        text content
        uuid parent_id FK "Self-ref for threads"
        datetime created_at
    }
    FOLLOW {
        uuid follower_id PK,FK
        uuid following_id PK,FK
        datetime created_at
    }
    LIKE {
        uuid user_id PK,FK
        uuid post_id PK,FK
        datetime created_at
    }
    COMMENT {
        uuid id PK
        uuid post_id FK
        uuid author_id FK
        text content
    }
```
