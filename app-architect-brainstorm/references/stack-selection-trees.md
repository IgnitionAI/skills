# Stack Selection Decision Trees

## Table of Contents
1. [Language Selection](#language)
2. [Runtime / Framework Selection](#runtime)
3. [Database Selection](#database)
4. [Architecture Style Selection](#architecture-style)
5. [Communication Protocol Selection](#protocol)
6. [Deployment Target Selection](#deployment)
7. [Quick Reference Matrix](#matrix)

---

## Language Selection

### Primary Decision: Team Expertise
```
TEAM_EXPERTISE ─┬─ Yes, team has strong preference ──→ Use it (unless disqualifying)
                └─ No / greenfield / learning project ──→ Continue to technical fit
```

### Technical Fit Decision Tree
```
NEED_SYSTEMS_PERF ─┬─ Yes (sub-ms latency, memory-constrained) ──→ Rust, C++, Zig, Go
                   └─ No ──→ Continue

NEED_ML_AI ─┬─ Yes (training, inference, data science) ──→ Python, Julia
            └─ No ──→ Continue

NEED_RAPID_PROTOTYPE ─┬─ Yes (MVP in weeks) ──→ TypeScript, Python, Ruby, PHP
                      └─ No ──→ Continue

TARGET_MOBILE ─┬─ Yes ──→ Dart (Flutter), Kotlin (Android), Swift (iOS)
                │         Cross-platform: Kotlin Multiplatform, React Native (TS)
                └─ No ──→ Continue

TARGET_ENTERPRISE ─┬─ Yes (big corp, legacy integration) ──→ Java, C#, Kotlin
                   └─ No ──→ Continue

NEED_CONCURRENCY ─┬─ Yes (10K+ simultaneous connections) ──→ Go, Rust, Erlang/Elixir
                  └─ No ──→ Continue

BEST_DEFAULT ──→ TypeScript (fullstack), Go (backend), Python (data/AI)
```

### Language Capability Matrix

| Language | Latency | Concurrency | Ecosystem | Dev Speed | Hiring | Best For |
|----------|---------|-------------|-----------|-----------|--------|----------|
| **Rust** | Sub-ms | Async/Parallel | Growing | Medium | Hard | Systems, WASM, high-perf APIs |
| **Go** | Low | Goroutines (best) | Large | High | Medium | APIs, microservices, CLIs, DevOps tools |
| **TypeScript** | Medium | Async/await | Massive | Very High | Easy | Fullstack web, rapid delivery |
| **Python** | Medium-High | Asyncio/GIL | Massive | Very High | Easy | ML, data, scripting, prototyping |
| **Java** | Low | Virtual threads (Loom) | Massive | Medium | Easy | Enterprise, big teams, Spring |
| **C#** | Low | Async/Parallel | Large | High | Medium | Enterprise, gaming (Unity), Windows |
| **Kotlin** | Low | Coroutines | Large | High | Medium | Android, JVM backend, multiplatform |
| **Swift** | Low | Async/await | Medium | High | Hard | iOS, macOS, server-side (Vapor) |
| **Dart** | Medium | Async/await | Medium | High | Medium | Flutter cross-platform |
| **Ruby** | Medium-High | Threads | Large | Very High | Medium | Prototyping, Rails apps |
| **PHP** | Medium | Fibers/async | Large | High | Easy | Web apps, Laravel, WordPress-scale |
| **Elixir** | Low | Processes (best) | Medium | High | Hard | Real-time, chat, telecom |
| **Zig** | Sub-ms | Async | Small | Medium | Very Hard | Systems programming, C replacement |
| **C++** | Sub-ms | Threads/Async | Large | Low | Hard | Games, embedded, HFT, systems |

---

## Runtime / Framework Selection

### By Product Archetype

#### Web Application (Fullstack)
```
NEED_SSR_SEO ─┬─ Yes ──→ Next.js (TS), Nuxt (Vue), SvelteKit, Laravel, Django
              └─ No ──→ Continue

PREF_REACT ─┬─ Yes ──→ Next.js, Remix, Vite+React (SPA)
            └─ No ──→ Continue

PREF_VUE ─┬─ Yes ──→ Nuxt, Vite+Vue
          └─ No ──→ Continue

PREF_OTHER ─┬─ Svelte ──→ SvelteKit
            ├─ Angular ──→ Angular CLI + SSR
            ├─ Ruby ──→ Rails
            ├─ Python ──→ Django, Flask
            ├─ PHP ──→ Laravel, Symfony
            └─ Go ──→ Templ + htmx, or Go backend + JS frontend
```

#### API-Only Service
```
NEED_AUTO_DOCS ─┬─ Yes ──→ FastAPI (Py), NestJS (TS), tsoa (TS), SpringDoc (Java)
                └─ No ──→ Continue

NEED_HIGHEST_PERF ─┬─ Yes ──→ Axum/Rocket (Rust), Gin/Echo (Go), Actix (Rust)
                   └─ No ──→ Continue

NEED_ENTERPRISE_DI ─┬─ Yes ──→ NestJS (TS), Spring Boot (Java), ASP.NET (C#)
                    └─ No ──→ Continue

NEED_MINIMAL ─┬─ Yes ──→ Express/Fastify (TS), Fiber (Go), Flask/FastAPI (Py)
              └─ No ──→ Continue

BEST_DEFAULT ──→ FastAPI (Py), NestJS (TS), Gin (Go), Axum (Rust)
```

#### Mobile Application
```
CROSS_PLATFORM ─┬─ Yes ──→
    │  Need native perf? → Kotlin Multiplatform, Flutter (Dart)
    │  Need web team reuse? → React Native (TS)
    │  Minimal budget? → Flutter
    └─ No (native) ──→
       iOS → Swift (SwiftUI/UIKit)
       Android → Kotlin (Compose/XML)
```

#### ML / Inference API
```
MODEL_FRAMEWORK ─┬─ PyTorch ──→ Python + FastAPI/Flask + torchserve
                 ├─ TensorFlow ──→ Python + TFServing or FastAPI
                 ├─ ONNX ──→ Python/Go/Rust + onnxruntime
                 └─ Custom ──→ Bindings to C++/Rust

SCALE_PREDICTIONS ─┬─ Batch (offline) ──→ Celery/RQ workers + queue
                   └─ Real-time ──→ FastAPI async + model cache in memory

GPU_NEEDED ─┬─ Yes ──→ Triton Inference Server, vLLM, Ray Serve
            └─ No ──→ CPU-optimized runtime (ONNX, TensorRT for edge)
```

#### Real-Time System (Chat, Live Data, Collaboration)
```
CONNECTION_TYPE ─┬─ WebSocket ──→ Socket.io (Node), ws (Go), SocketKit (Rust)
                 ├─ SSE ──→ FastAPI, Express, any async framework
                 └─ MQTT ──→ Mosquitto, HiveMQ, EMQX

NEED_PRESENCE ─┬─ Yes (who's online) ──→ Redis + pub/sub + connection state
               └─ No ──→ Simpler

NEED_HORIZONTAL_SCALE ─┬─ Yes ──→ Redis Adapter (Socket.io), NATS, RabbitMQ
                       └─ No ──→ In-memory pub/sub sufficient
```

#### CLI Tool
```
DISTRIBUTION ─┬─ Single binary ──→ Go, Rust, Zig
              ├─ Needs scripting ──→ Python, Ruby, Node
              └─ Plugin ecosystem ──→ Go (cobra), Rust (clap), Python (click)

NEED_TUI ─┬─ Yes (interactive UI) ──→ Bubble Tea (Go), Ratatui (Rust), Rich (Python)
          └─ No ──→ Standard CLI libraries
```

#### Data Pipeline
```
SCALE ─┬─ Small (MBs) ──→ Python scripts, Airflow, Prefect
       ├─ Medium (GBs) ──→ Kafka + Flink/Spark, dbt
       └─ Large (TBs+) ──→ Spark, Flink, Snowflake, BigQuery

STREAMING ─┬─ Yes ──→ Kafka/Pulsar/RabbitMQ + stream processor
           └─ No (batch) ──→ Airflow/Dagster + data warehouse
```

---

## Database Selection

```
NEED_TRANSACTIONS ─┬─ Yes (ACID required) ──→ PostgreSQL (default), MySQL, SQLite (embedded)
                   └─ No / eventual OK ──→ Continue

NEED_FLEXIBLE_SCHEMA ─┬─ Yes ──→ MongoDB (default), Couchbase, Firestore
                      └─ No ──→ Continue

NEED_TIME_SERIES ─┬─ Yes ──→ TimescaleDB (PostgreSQL), InfluxDB, ClickHouse
                  └─ No ──→ Continue

NEED_GRAPH_QUERIES ─┬─ Yes ──→ Neo4j, Amazon Neptune, PostgreSQL + pg_graph
                    └─ No ──→ Continue

NEED_SEARCH ─┬─ Yes (full-text) ──→ Elasticsearch, Meilisearch, PostgreSQL tsvector
             └─ No ──→ Continue

NEED_CACHE ─┬─ Yes ──→ Redis (default), KeyDB, Memcached
            └─ No ──→ Continue

DEFAULT ──→ PostgreSQL (always start here unless reason not to)
```

### Database Combinations (Polyglot Persistence)

| Use Case | Primary DB | Cache | Search | Queue |
|----------|-----------|-------|--------|-------|
| Standard web app | PostgreSQL | Redis | - | Redis/DB |
| High-scale API | PostgreSQL + read replicas | Redis | - | Redis/RabbitMQ |
| Content platform | PostgreSQL | Redis | Elasticsearch | Redis |
| E-commerce | PostgreSQL | Redis | Elasticsearch | RabbitMQ |
| Social network | PostgreSQL + Cassandra | Redis | Elasticsearch | Kafka |
| Real-time game | ScyllaDB/Cassandra | Redis | - | Redis pub/sub |
| IoT platform | TimescaleDB | Redis | - | Kafka/MQTT |
| ML feature store | PostgreSQL | Redis | - | Kafka + Feast |

---

## Architecture Style Selection

```
TEAM_SIZE ─┬─ 1-3 devs ──→ Monolith (always)
           ├─ 4-8 devs ──→ Modular monolith (bounded contexts as modules)
           └─ 9+ devs ──→ Evaluate microservices per team

NEED_INDEPLOY ─┬─ Yes (teams deploy independently) ──→ Microservices / Modular monolith with独立 deploy
               └─ No ──→ Monolith / Modular monolith

EVENT_HEAVY ─┬─ Yes (events > CRUD) ──→ Event-driven + message broker
             └─ No ──→ Request-response

READ_WRITE_RATIO ─┬─ > 10:1 ──→ CQRS (separate read/write models)
                  └─ < 10:1 ──→ Single model

GLOBAL ─┬─ Yes (multi-region) ──→ Eventual consistency, geo-partitioning
        └─ No ──→ Strong consistency OK
```

---

## Communication Protocol Selection

| Context | Protocol | When |
|---------|----------|------|
| Browser ↔ Backend | HTTP/REST | Default, caching, simple |
| Browser ↔ Backend | GraphQL | Flexible queries, many client types |
| Browser ↔ Backend | WebSocket | Real-time bidirectional |
| Browser ↔ Backend | SSE | Server push, one-way |
| Browser ↔ Backend | tRPC | TypeScript fullstack, end-to-end types |
| Browser ↔ Backend | gRPC-Web | High perf, schema-driven (needs proxy) |
| Service ↔ Service | gRPC | High perf, binary, streaming |
| Service ↔ Service | HTTP/REST | Simplicity, debugging |
| Service ↔ Service | Message Queue | Async, decoupled, event-driven |
| Service ↔ Service | Event Bus | Pub/sub, event sourcing |
| Mobile ↔ Backend | REST | Universal, cacheable |
| Mobile ↔ Backend | GraphQL | Bandwidth optimization |
| CLI ↔ Backend | REST | Simple, curlable |
| CLI ↔ Backend | gRPC | Performance, streaming output |

---

## Deployment Target Selection

```
BUDGET ─┬─ Minimal / side project ──→ Railway, Render, Fly.io, Vercel, Netlify
        ├─ Small-medium ──→ AWS/GCP/Azure (managed: ECS, Cloud Run, App Service)
        └─ Large / enterprise ──→ Kubernetes (EKS/GKE/AKS) or self-managed

COMPLEXITY ─┬─ Simple (1-3 services) ──→ Docker Compose, managed PaaS
            ├─ Medium (4-10 services) ──→ ECS/Fargate, Cloud Run, Dokku
            └─ Complex (10+ services) ──→ Kubernetes, Nomad

NEED_EDGE ─┬─ Yes (global low-latency) ──→ Cloudflare Workers, Vercel Edge, Lambda@Edge
           └─ No ──→ Centralized deployment OK

SELF_HOSTED ─┬─ Yes (compliance, cost) ──→ Docker + VM + Nginx/Traefik
             └─ No ──→ Cloud managed
```

---

## Quick Reference Matrix

### "I need to build a..." → Recommended Defaults

| Product Type | Language | Framework | Database | Architecture |
|-------------|----------|-----------|----------|--------------|
| SaaS web app | TypeScript | Next.js/NestJS | PostgreSQL | Modular monolith |
| Mobile app (cross-platform) | Dart | Flutter | PostgreSQL + local SQLite | API + offline sync |
| API backend (performance) | Go | Gin/Fiber | PostgreSQL | Clean Architecture |
| API backend (rapid) | Python | FastAPI | PostgreSQL | Layered |
| Enterprise backend | Java/Kotlin | Spring Boot | PostgreSQL | Hexagonal |
| ML inference API | Python | FastAPI + torch | Redis cache | Async workers |
| Real-time chat | TypeScript/Go | Socket.io/WS | Redis | Event-driven |
| CLI tool | Go/Rust | Cobra/Clap | SQLite/None | Command pattern |
| Data pipeline | Python/Scala | Airflow/Spark | PostgreSQL + warehouse | Stream/batch |
| Internal tool | TypeScript/Python | Retool-like or Next.js/Laravel | PostgreSQL | Monolith |
