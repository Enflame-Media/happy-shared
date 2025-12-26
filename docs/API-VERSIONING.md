# API Versioning Policy

This document describes the API versioning strategy for Happy Server, including how versions are managed, what constitutes breaking vs. non-breaking changes, and how the CI pipeline enforces API contract stability.

## Versioning Strategy

### URL-Based Versioning

Happy Server uses **URL path versioning** with the `/v1/` prefix:

```
https://api.happy.engineering/v1/sessions
https://api.happy.engineering/v1/auth/token
```

This approach was chosen for:
- **Explicitness**: The version is clearly visible in every request
- **Cacheability**: Different versions can be cached independently
- **Simplicity**: Easy to understand and implement

### Current Version

| Version | Status | Description |
|---------|--------|-------------|
| `/v1/` | **Current** | Production API, actively maintained |

### Future Versions

When a new major version is needed (e.g., `/v2/`):
1. Both versions will run in parallel during a deprecation period
2. Clients will be notified via push notifications and app updates
3. The old version will be deprecated with a sunset date
4. After the sunset date, the old version will return `410 Gone`

## Change Classification

### Non-Breaking Changes (Safe)

These changes are backward-compatible and can be deployed without version increment:

| Change Type | Example | Safe? |
|-------------|---------|-------|
| Add new endpoint | `POST /v1/sessions/archive` | ✅ |
| Add optional request field | `{ "name": "...", "tags"?: [] }` | ✅ |
| Add response field | `{ "id": "...", "createdAt": "..." }` | ✅ |
| Widen accepted values | Accept both `"active"` and `"ACTIVE"` | ✅ |
| Add new enum value (response) | Status: `"pending"` → `"pending" \| "queued"` | ✅ |
| Increase rate limits | 100 req/min → 200 req/min | ✅ |
| Improve error messages | Better descriptions | ✅ |

### Breaking Changes (Require New Version)

These changes break existing clients and require a new API version:

| Change Type | Example | Breaking? |
|-------------|---------|-----------|
| Remove endpoint | Delete `GET /v1/legacy` | ❌ |
| Remove request field | Remove `{ "oldField": "..." }` | ❌ |
| Remove response field | Remove `"legacyId"` from response | ❌ |
| Rename field | `userId` → `user_id` | ❌ |
| Change field type | `"count": "5"` → `"count": 5` | ❌ |
| Add required request field | New required `"apiVersion"` field | ❌ |
| Change URL structure | `/v1/sessions` → `/v1/claude/sessions` | ❌ |
| Narrow accepted values | Remove accepted enum value | ❌ |
| Change authentication | Bearer → API Key | ❌ |
| Reduce rate limits | 100 req/min → 50 req/min | ❌ |

## OpenAPI Specification

### Automatic Generation

The OpenAPI specification is automatically generated from route schemas using `@fastify/swagger` and Zod schemas:

```bash
# Generate OpenAPI spec
cd happy-server
yarn openapi:generate        # Creates openapi.json
yarn openapi:generate:yaml   # Creates openapi.yaml
```

### Accessing the Spec

| Method | URL/Command |
|--------|-------------|
| Runtime (JSON) | `GET /documentation/json` |
| Runtime (YAML) | `GET /documentation/yaml` |
| Generated file | `happy-server/openapi.json` |
| CI Artifact | Download from GitHub Actions |

### CI Validation

The CI pipeline validates the OpenAPI spec on every PR:

1. **Generation**: Spec is generated from current route schemas
2. **Linting**: Validated using Redocly CLI for OpenAPI 3.0 compliance
3. **Artifact**: Uploaded as a build artifact for review

```yaml
# .github/workflows/ci.yml
openapi-server:
  name: OpenAPI - happy-server
  steps:
    - run: yarn openapi:generate
    - run: npx @redocly/cli lint openapi.json
```

## Schema Definition Guidelines

### Using Zod for Route Schemas

All route schemas should use Zod for type-safe validation:

```typescript
import { z } from "zod";

app.post('/v1/sessions', {
    schema: {
        body: z.object({
            name: z.string().describe("Session name"),
            machineId: z.string().uuid().describe("Machine identifier"),
        }),
        response: {
            200: z.object({
                id: z.string().uuid(),
                name: z.string(),
                createdAt: z.string().datetime(),
            }),
            400: z.object({
                error: z.string(),
                code: z.string(),
            }),
        },
    },
}, handler);
```

### Documentation Best Practices

1. **Use `.describe()`** on Zod schemas for OpenAPI descriptions
2. **Define all response codes** including error responses
3. **Use appropriate Zod types** (`z.string().uuid()`, `z.string().datetime()`)
4. **Group endpoints with tags** in route handlers

## Shared Types with @happy/protocol

The `@happy/protocol` package contains shared Zod schemas for API payloads:

```typescript
// In @happy/protocol
export const SessionUpdateSchema = z.object({
    sessionId: z.string(),
    status: z.enum(["active", "paused", "completed"]),
    // ...
});

// In happy-server route
import { SessionUpdateSchema } from "@happy/protocol";

app.post('/v1/sessions/update', {
    schema: {
        body: SessionUpdateSchema,
    },
}, handler);
```

This ensures type consistency between:
- `happy-server` (API producer)
- `happy-cli` (API consumer)
- `happy-app` (API consumer)

## Deprecation Process

### Deprecating an Endpoint

1. Add `deprecated: true` to the route schema
2. Add `X-Deprecated` response header with sunset date
3. Update OpenAPI spec description with deprecation notice
4. Log usage of deprecated endpoints for monitoring
5. After sunset date, return `410 Gone`

```typescript
app.get('/v1/legacy-endpoint', {
    schema: {
        deprecated: true,
        description: "**DEPRECATED**: Use /v1/new-endpoint instead. Sunset: 2025-06-01",
    },
}, handler);
```

### Deprecating a Field

1. Mark field as deprecated in Zod schema
2. Continue accepting the field but ignore it
3. Stop including in responses after sunset
4. Document in changelog

## Monitoring & Alerts

### API Contract Monitoring

- **CI Failure**: OpenAPI validation fails on PR
- **Schema Drift**: Detected by comparing generated spec to baseline
- **Deprecated Usage**: Logged and alerted when deprecated endpoints are called

### Recommended Monitoring

```typescript
// Log deprecated endpoint usage
app.addHook('onRequest', (request, reply, done) => {
    if (isDeprecated(request.url)) {
        log({
            module: 'api-deprecation',
            level: 'warn',
            url: request.url,
            userId: request.userId,
        }, 'Deprecated endpoint accessed');
    }
    done();
});
```

## Related Documentation

- [Encryption Architecture](./ENCRYPTION-ARCHITECTURE.md) - E2E encryption design
- [RFC: Shared Types Package](./RFC-SHARED-TYPES-PACKAGE.md) - @happy/protocol design
- [@happy/protocol CLAUDE.md](../packages/@happy/protocol/CLAUDE.md) - Protocol package guidelines

## Changelog

| Date | Change | Issue |
|------|--------|-------|
| 2025-12-26 | Initial API versioning policy | HAP-473 |
