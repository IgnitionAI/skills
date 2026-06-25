# Brainstorming Method: Socratic Architecture Design

## Table of Contents
1. [Question Banks by Phase](#question-banks)
2. [Challenge Patterns](#challenge-patterns)
3. [Decision Frameworks](#decision-frameworks)
4. [Common User Biases](#user-biases)

---

## Question Banks

### Phase 1: Domain Discovery Questions

**Business Context** (always ask first):
- "Describe the application in one sentence to a non-technical person."
- "Who are the 3 main user types? What does each do daily?"
- "What's the #1 metric that determines success?"
- "Is this replacing an existing system? What are its biggest flaws?"
- "What regulatory or compliance constraints apply? (GDPR, HIPAA, SOX, PCI)"

**Scope & Constraints**:
- "What's the timeline? MVP vs v1 vs scale?"
- "How many concurrent users in year 1? Year 3?"
- "What's the budget ceiling for infrastructure?"
- "Is this single-tenant or multi-tenant?"
- "Do you need real-time features? (WebSocket, SSE, polling)"

**Integration Landscape**:
- "What external APIs or services must you integrate?"
- "Do you send or receive webhooks?"
- "Is there an existing auth system (SSO, LDAP, OAuth provider)?"
- "Do you need event streaming (Kafka, RabbitMQ, SQS)?"
- "Any file storage requirements? (S3, Azure Blob, local)"

**Team & Operations**:
- "How many developers? Their seniority?"
- "Do you have DevOps/SRE support?"
- "What's the deployment target? (AWS, GCP, Azure, on-prem, Vercel)"
- "Do you need CI/CD from day one?"
- "What's your observability requirement? (Datadog, Grafana, CloudWatch)"

### Phase 2: Database Challenge Questions

**Entity Design**:
- "If you delete a User, what happens to their Orders? (CASCADE vs SOFT DELETE vs ARCHIVE)"
- "Is this field truly an attribute, or does it have its own lifecycle?"
- "Can two different entities share this value? Should it be normalized?"
- "What's the cardinality? One-to-one, one-to-many, many-to-many?"
- "Does this relationship need metadata? (e.g., ORDER_PRODUCT needs quantity, price_at_time)"

**Performance & Scale**:
- "Which tables will grow fastest? What's the expected row count in 1 year?"
- "What's the read/write ratio for this entity?"
- "Will you need full-text search?"
- "Do you need partitioning or sharding eventually?"
- "Are there time-series data patterns here?"

**Data Integrity**:
- "Should this be enforced at DB level (constraint) or app level?"
- "What fields must be unique together? (composite unique)"
- "Do you need optimistic locking? (version/timestamp field)"
- "How do you handle migrations with zero downtime?"
- "What's your backup and disaster recovery strategy?"

### Phase 3: Backend Architecture Questions

**Clean Architecture Validation**:
- "If you remove your framework, how much code survives? (Domain layer should be 100%)"
- "Can you unit test this use case without a database? (mock the repository)"
- "Where does the transaction boundary start and end?"
- "Is this a domain service or an application service?"

**API Design**:
- "REST or GraphQL or gRPC? What does the client need?"
- "How do you handle pagination? Cursor vs offset?"
- "What's your error response format? RFC 7807 (Problem Details)?"
- "How do you version your API? (URL, header, content negotiation)"
- "Where do you handle rate limiting?"

**Async & Events**:
- "Is this operation synchronous or can it be queued?"
- "What happens if the event consumer fails? (dead letter queue)"
- "Do you need exactly-once or at-least-once delivery?"
- "How do you handle distributed transactions? (Saga pattern)"
- "Where do you need idempotency keys?"

### Phase 4: Frontend Architecture Questions

**Component Design**:
- "Is this component presentational or container?"
- "Will this be reused elsewhere? If not, should it be?"
- "What are the loading, empty, error, and success states?"
- "Is this animation necessary or decorative?"
- "How does this behave on mobile? Tablet?"

**State Management**:
- "Who owns this state? Should it be lifted or colocated?"
- "Is this server state or client state? (different lifecycles)"
- "Do you need optimistic updates for this mutation?"
- "Should this persist across sessions? (localStorage/sessionStorage)"
- "How do you handle race conditions in async operations?"

**Performance**:
- "What's the bundle size budget?"
- "Do you need code splitting or lazy loading?"
- "Will you use SSR/SSG/ISR? For which pages?"
- "How do you handle images? (WebP, responsive, CDN)"
- "Do you need virtual scrolling for large lists?"

---

## Challenge Patterns

### Pattern: The 5 Whys
When a user proposes a solution, ask "Why?" 5 times to uncover root motivation.

Example:
- User: "I need a microservice for notifications."
- Agent: "Why microservices specifically?" → "To scale independently."
- "Why do you expect notifications to need independent scaling?" → "We send 1M emails/day."
- "Have you measured the bottleneck? What are the current numbers?" → "Not yet."
- "Would a queue + worker pool in a monolith solve this first?" → "Probably."
- "Let's start there. When do you graduate to microservices?" → "When we hit X throughput."

### Pattern: Premature Optimization Check
When user proposes complex solutions for simple problems:

| User Says | Challenge |
|-----------|-----------|
| "I need Kubernetes" | "How many services? Do you need auto-healing? What's your ops capacity?" |
| "I need CQRS" | "Do you have different read/write models? Is read performance actually a problem?" |
| "I need Event Sourcing" | "Do you need full audit history? Can you handle eventual consistency?" |
| "I need GraphQL" | "How many client types? Do they need flexible queries?" |
| "I need micro-frontends" | "How many teams own the UI? Do they deploy independently?" |

### Pattern: Hidden Complexity Reveal
Surface implicit complexity the user hasn't considered:

- "You said users can sign up with email and social. Have you considered account linking when the same email is used?"
- "You have a 'pending' status. How long can it stay pending? What happens after timeout?"
- "You allow file uploads. What's the max size? Virus scanning? Storage limit per user?"
- "Your pricing has a 'team' tier. Who pays? What happens when the payer leaves?"

---

## Decision Frameworks

### Monolith vs Microservices Decision Tree

```
Team size < 5? → MONOLITH
Need independent deploy per team? → MICROSERVICES (but check: N teams > 3?)
Different scalability requirements per service? → MICROSERVICES
Strict data isolation requirements? → MICROSERVICES
 MVP/proof of concept? → MONOLITH
Complex distributed transactions? → MONOLITH (or Saga carefully)
```

### SQL vs NoSQL Decision Matrix

| Factor | SQL | NoSQL |
|--------|-----|-------|
| Complex relationships | ✅ | ⚠️ |
| ACID transactions | ✅ | ⚠️ |
| Schema flexibility | ⚠️ | ✅ |
| Horizontal scaling | ⚠️ | ✅ |
| Ad-hoc queries | ✅ | ⚠️ |
| Time-series data | ⚠️ | ✅ |
| Full-text search | ⚠️ | ✅ |
| Geographic data | ⚠️ | ✅ |

### Frontend Framework Selection

| Factor | React | Vue | Angular | Svelte |
|--------|-------|-----|---------|--------|
| Team size (large) | ✅ | ⚠️ | ✅ | ⚠️ |
| Ecosystem size | ✅ | ✅ | ✅ | ⚠️ |
| Learning curve | Medium | Low | High | Low |
| Enterprise support | ✅ | ⚠️ | ✅ | ⚠️ |
| Performance | Good | Good | Good | ✅ |
| Mobile (Native) | ✅ | ⚠️ | ⚠️ | ⚠️ |

---

## Common User Biases

Watch for these and counter them:

1. **Hype-driven**: "I read about X, let's use it." → "What's your specific use case that X solves better?"
2. **Big-tech envy**: "Netflix does microservices." → "Netflix has 3000+ engineers. What's your team size?"
3. **Over-normalization**: 8 tables for a blog post → "What's the actual query pattern? JOIN hell?"
4. **Under-normalization**: Single table with 50 columns → "Update anomalies? What's the write pattern?"
5. **Gold plating**: OAuth2 + SSO + magic link + OTP for an internal tool → "Who are the users? What's the threat model?"
6. **NIH syndrome**: "I'll build my own auth." → "Have you considered Auth0/Clerk/Keycloak? What's the TCO?"
