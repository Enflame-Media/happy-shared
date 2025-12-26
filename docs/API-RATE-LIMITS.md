# API Rate Limiting

This document describes the rate limiting system implemented in happy-server to protect against abuse and ensure fair resource usage.

## Overview

Rate limiting is implemented using [@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit) with Redis backend for distributed rate limiting across multiple server instances.

### Key Features

- **Redis-backed**: Consistent rate limits across all server instances
- **Per-user tracking**: Authenticated requests use `userId` as the rate limit key
- **IP fallback**: Unauthenticated requests fall back to IP-based limiting
- **Graceful degradation**: API continues functioning if Redis fails
- **Standard headers**: IETF draft spec rate limit headers on all responses

## Rate Limit Tiers

Endpoints are categorized into four tiers based on their computational cost and abuse potential:

| Tier | Limit | Use Case | Example Endpoints |
|------|-------|----------|-------------------|
| **CRITICAL** | 5/min | External paid APIs | `/v1/voice/token` (ElevenLabs) |
| **HIGH** | 30/min | Auth, crypto, DB writes | `/v1/auth`, `/v1/sessions` (POST), `/v1/artifacts` (POST/DELETE) |
| **MEDIUM** | 60/min | List/query endpoints | `/v1/sessions` (GET), `/v1/artifacts` (GET), `/v1/feed` |
| **LOW** | 120/min | Simple reads | `/v1/version`, `/v1/machines/:id` (GET) |

### Health Check Exemption

The following endpoints are **exempt from rate limiting** to ensure monitoring systems can always check server health:

- `GET /v1/health` - Liveness probe
- `GET /ready` - Readiness probe

## Response Headers

All responses include standard rate limit headers:

```http
HTTP/1.1 200 OK
x-ratelimit-limit: 60
x-ratelimit-remaining: 45
x-ratelimit-reset: 1703600400
```

### Header Descriptions

| Header | Description |
|--------|-------------|
| `x-ratelimit-limit` | Maximum requests allowed in the time window |
| `x-ratelimit-remaining` | Requests remaining in the current window |
| `x-ratelimit-reset` | Unix timestamp when the limit resets |
| `retry-after` | Seconds until retry allowed (only on 429 responses) |

## Rate Limit Exceeded Response

When a rate limit is exceeded, the API returns HTTP 429:

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded, retry in 30 seconds",
  "retryAfter": 30
}
```

## Endpoint Reference

### CRITICAL Tier (5 requests/minute)

These endpoints involve external paid API calls:

| Endpoint | Method | Reason |
|----------|--------|--------|
| `/v1/voice/token` | POST | ElevenLabs API call ($$$) + RevenueCat subscription check |

### HIGH Tier (30 requests/minute)

These endpoints involve authentication, cryptographic operations, or database writes:

| Endpoint | Method | Reason |
|----------|--------|--------|
| `/v1/auth` | POST | Crypto verification + DB upsert + JWT creation |
| `/v1/auth/request` | POST | Crypto validation + DB upsert |
| `/v1/auth/response` | POST | Auth + DB update |
| `/v1/auth/account/request` | POST | Crypto validation + DB upsert |
| `/v1/auth/account/response` | POST | Auth + DB update |
| `/v1/sessions` | POST | DB create + event emission |
| `/v1/sessions/:id` | DELETE | Cascade delete + event emission |
| `/v1/artifacts` | POST | DB write + event emission |
| `/v1/artifacts/:id` | POST | Version control + DB update + event |
| `/v1/artifacts/:id` | DELETE | DB delete + event emission |
| `/v1/machines` | POST | DB lookup + potential create + events |
| `/v1/machines/:id/status` | PUT | Status update + event emission |
| `/v1/access-keys/:sessionId/:machineId` | POST | DB create |
| `/v1/access-keys/:sessionId/:machineId` | PUT | Version control + DB update |
| `/v1/push-tokens` | POST | Token registration |
| `/v1/push-tokens/:token` | DELETE | Token deletion |
| `/v1/connect/*` | ALL | OAuth flows, external API calls |
| `/v1/friends/add` | POST | Relationship modification |
| `/v1/friends/remove` | POST | Relationship modification |
| `/v1/account/settings` | POST | Settings update with version check |
| `/v1/kv` | POST | Batch mutation |
| `/logs-combined-...` | POST | Dev logging (when enabled) |

### MEDIUM Tier (60 requests/minute)

These endpoints involve database queries and list operations:

| Endpoint | Method | Reason |
|----------|--------|--------|
| `/v1/sessions` | GET | Returns up to 150 sessions |
| `/v2/sessions` | GET | Cursor pagination |
| `/v1/sessions/:id/messages` | GET | Up to 150 messages |
| `/v1/artifacts` | GET | All user artifacts |
| `/v1/machines` | GET | Machine listing |
| `/v1/account/profile` | GET | Profile with relations |
| `/v1/account/settings` | GET | Settings lookup |
| `/v1/feed` | GET | Feed aggregation |
| `/v1/kv` | GET | Key-value listing |
| `/v1/kv/:key` | GET | Single KV lookup |
| `/v1/kv/bulk` | POST | Bulk KV lookup |
| `/v1/push-tokens` | GET | Token listing |
| `/v1/friends` | GET | Friends list |
| `/v1/user/search` | GET | User search |
| `/v1/access-keys/:sessionId/:machineId` | GET | Access key lookup |
| `/v1/usage/query` | POST | Usage aggregation |
| `/v1/connect/github` | GET | GitHub connection status |

### LOW Tier (120 requests/minute)

These endpoints are simple reads with minimal server load:

| Endpoint | Method | Reason |
|----------|--------|--------|
| `/v1/auth/request/status` | GET | Simple DB lookup |
| `/v2/sessions/active` | GET | Filtered, small result |
| `/v1/sessions/:id` | GET | Single session lookup |
| `/v1/artifacts/:id` | GET | Single artifact lookup |
| `/v1/machines/:id` | GET | Single machine lookup |
| `/v1/version` | POST | No DB, static response |
| `/v1/user/:id` | GET | Single user lookup |

## Implementation Details

### Key Generation

Rate limit keys are generated based on authentication status:

```typescript
keyGenerator: (request) => {
    if (request.userId) {
        return `user:${request.userId}`;  // Authenticated
    }
    return request.ip;  // Unauthenticated
}
```

### Graceful Degradation

If Redis is unavailable, rate limiting falls back to in-memory limiting per server instance:

```typescript
skipOnError: true  // Continue without rate limiting on Redis failure
```

### Test Environment

Rate limiting is **disabled** when `NODE_ENV=test` to prevent test interference.

## Monitoring

Rate limit events are logged with warning level:

- **Approaching limit**: Logged when a client is close to their limit
- **Exceeded limit**: Logged when a 429 response is sent

Log format:
```
[rate-limit] WARN: Rate limit exceeded for user:abc123: POST /v1/sessions
```

## Client Best Practices

1. **Respect headers**: Check `x-ratelimit-remaining` before making requests
2. **Exponential backoff**: On 429 responses, wait for `retry-after` seconds
3. **Batch operations**: Use bulk endpoints (e.g., `/v1/kv/bulk`) when possible
4. **Cache responses**: Avoid repeated requests for the same data

## Adjusting Limits

Rate limits are configured in `sources/app/api/utils/enableRateLimiting.ts`:

```typescript
export const RateLimitTiers = {
    CRITICAL: { max: 5, timeWindow: '1 minute' },
    HIGH: { max: 30, timeWindow: '1 minute' },
    MEDIUM: { max: 60, timeWindow: '1 minute' },
    LOW: { max: 120, timeWindow: '1 minute' },
} as const;
```

To adjust a specific endpoint's tier, modify its route configuration:

```typescript
app.get('/v1/endpoint', {
    config: {
        rateLimit: RateLimitTiers.HIGH  // Change tier here
    }
}, handler);
```

## Related Documentation

- [@fastify/rate-limit documentation](https://github.com/fastify/fastify-rate-limit)
- [IETF Draft: RateLimit Header Fields](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)
