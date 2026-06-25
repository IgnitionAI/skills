# Architecture Design Guide: ML / Inference API

## Purpose

Design patterns for model serving APIs optimized for prediction workloads.

## Architecture Overview

```
Client Request
  → Validation (strict input schema)
  → Cache Check (input hash → cached prediction?)
  → Preprocess (normalize, tokenize, transform)
  → Model Runtime (inference)
  → Postprocess (format output, add metadata)
  → Cache Store (save for future identical inputs)
  → Return Prediction
```

## Key Design Patterns

### Model Versioning
- Multiple model versions loaded simultaneously
- Route by header or query parameter: `?model_version=v2`
- A/B testing: route percentage of traffic to new version

### Prediction Caching
- Hash input → cache result (TTL based on model staleness)
- Cache key includes model version (v1 prediction ≠ v2 prediction)

### Batch vs Real-Time Separation
- **Real-time path**: Direct inference, < 100ms target
- **Batch path**: Queue → worker → result stored → webhook notification
- Never mix: batch jobs must not block real-time requests

### GPU Resource Management
- Model loaded into GPU memory at startup (not per-request)
- Request queue with timeout (prevent GPU OOM)
- Horizontal scaling: one model replica per GPU

## Component Specification

| Component | Responsibility | Location |
|-----------|---------------|----------|
| Input Validator | Schema validation, sanitization | `interface/` |
| Prediction Cache | Input hash → result (Redis) | `infrastructure/cache/` |
| Model Runtime | Load model, run inference | `infrastructure/model-runtime/` |
| Model Registry | Version management, A/B routing | `infrastructure/model-store/` |
| Batch Queue | Job queuing, worker distribution | `infrastructure/queue/` |
| Health Probe | Liveness + readiness checks | `interface/http/` |

## Health Check Design

Two distinct endpoints:
- `GET /health` → Process is alive (always 200 if process runs)
- `GET /ready` → Model is loaded and GPU is ready (200 or 503)

Kubernetes uses `/health` for restart decision, `/ready` for traffic routing.
tive and throughput paths
5. **Model versioning in URL or header**: `/predict?model_version=v2` or `X-Model-Version: v2`
6. **Health checks separate from readiness**: `/health` (process alive) vs `/ready` (model loaded)
7. **Graceful degradation**: If model fails, return cached or default response, don't 500
8. **Observability**: Track inference latency, throughput, model version distribution, input distribution drift

## Environment Variables

```env
# Model
MODEL_PATH=/models/{{MODEL_NAME}}
MODEL_VERSION=latest
MODEL_DEVICE=cuda  # or cpu, mps (Apple Silicon)

# Performance
MAX_BATCH_SIZE=32
INFERENCE_TIMEOUT_MS=5000
PREDICTION_CACHE_TTL=300

# Scaling
WORKERS=4              # Number of inference workers
GPU_MEMORY_FRACTION=0.9  # % of GPU memory to use
```
