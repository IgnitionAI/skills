# Architecture Specification: {Project Name}

## 1. Overview
- **Project**: {Name}
- **Purpose**: {One-sentence description}
- **Date**: {YYYY-MM-DD}
- **Status**: {Draft / Approved}

## 2. Context & Goals
### Business Context
{Describe the business problem being solved}

### Target Users
| User Type | Role | Key Actions |
|-----------|------|-------------|
| {User A}  | {Role} | {Action 1}, {Action 2} |
| {User B}  | {Role} | {Action 3} |

### Success Metrics
- {Metric 1}
- {Metric 2}

## 3. Domain Model
### Core Entities
```mermaid
erDiagram
    {Paste ER diagram from Phase 2}
```

### Bounded Contexts
| Context | Entities | Team |
|---------|----------|------|
| {Auth}  | User, Session, Permission | {Team A} |
| {Core}  | {Entity1, Entity2} | {Team B} |

## 4. Database Schema
### Table Definitions
| Table | Description | Key Columns | Indexes |
|-------|-------------|-------------|---------|
| {users} | {User accounts} | {id, email, status} | {email UK, status} |

### Migration Strategy
- {Initial migration: {date}}
- {Zero-downtime approach: {description}}

## 5. Backend Architecture
### Clean Architecture Layers
```mermaid
graph TD
    A[Presentation Layer<br/>{Framework} Controllers] --> B[Application Layer<br/>Use Cases / Services]
    B --> C[Domain Layer<br/>Entities / Repository Interfaces]
    C --> D[Infrastructure Layer<br/>{DB} / {Cache} / {External APIs}]
    style C fill:#e1f5e1,stroke:#333
```

### API Specification
| Endpoint | Method | Request | Response | Auth |
|----------|--------|---------|----------|------|
| /api/v1/{resource} | POST | {DTO} | {201 + body} | Bearer |
| /api/v1/{resource} | GET | Query params | {200 + list} | Bearer |

### Technology Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Language | {TypeScript/Java/Go/Python} | {version} |
| Framework | {NestJS/Spring/FastAPI} | {version} |
| Database | {PostgreSQL/MySQL/MongoDB} | {version} |
| Cache | {Redis/None} | {version} |
| Message Queue | {RabbitMQ/Kafka/SQS/None} | {version} |
| Testing | {Jest/JUnit/Pytest} | {version} |

## 6. Frontend Architecture
### Component Tree
```mermaid
graph TD
    App --> Layout
    Layout --> {Feature1}Pages
    Layout --> {Feature2}Pages
```

### State Management
| State Type | Solution | Scope |
|------------|----------|-------|
| Server | {TanStack Query / SWR} | API data |
| Global Client | {Zustand / Redux / Pinia} | Auth, UI |
| Form | {React Hook Form / VeeValidate} | All forms |

### Technology Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | {React/Vue/Angular} | {version} |
| Routing | {React Router/Vue Router} | {version} |
| Styling | {Tailwind/CSS Modules} | {version} |
| Components | {shadcn/ui/Material UI} | {version} |
| Testing | {Vitest/Jest} | {version} |

## 7. Infrastructure
### Deployment
- **Platform**: {AWS/GCP/Azure/Vercel/On-prem}
- **Container**: {Docker / None}
- **Orchestration**: {Kubernetes/ECS/Docker Compose/None}

### CI/CD Pipeline
```
{Source Control} → {Build} → {Test} → {Deploy to Staging} → {E2E Tests} → {Deploy to Prod}
```

### Environment Configuration
| Environment | URL | Database | Notes |
|-------------|-----|----------|-------|
| Local | localhost:3000 | Docker container | Hot reload |
| Staging | staging.example.com | Staging DB | Auto-deploy from main |
| Production | example.com | Production DB | Manual approval |

## 8. Security
- Authentication: {JWT / OAuth2 / Session}
- Authorization: {RBAC / ABAC / ACL}
- Data encryption: {At rest: AES-256, In transit: TLS 1.3}
- Secrets management: {AWS Secrets Manager / HashiCorp Vault / .env}

## 9. Monitoring & Observability
- Logging: {Structured JSON logs}
- Metrics: {Prometheus + Grafana / Datadog}
- Tracing: {OpenTelemetry / Jaeger}
- Alerts: {PagerDuty / Slack webhooks}

## 10. Architecture Decisions
| ADR | Title | Status |
|-----|-------|--------|
| ADR-001 | {Title} | Accepted |

## 11. Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| {Risk 1} | {High/Med/Low} | {High/Med/Low} | {Strategy} |

## 12. Future Considerations
- {Scale triggers}
- {Planned features}
- {Technical debt items}
