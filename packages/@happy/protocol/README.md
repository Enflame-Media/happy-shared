# @happy/protocol

Shared protocol types for the Happy monorepo. This package provides **Zod schemas** and **TypeScript types** for the Happy sync protocol, serving as the single source of truth across all four consumer projects.

## Installation

This package is automatically available within the Happy monorepo via **yarn workspaces**. No additional installation is required.

```bash
# From monorepo root - already included in workspace
yarn install
```

## Usage

### ESM (happy-cli, happy-app, happy-server-workers)

```typescript
import {
  ApiUpdateSchema,
  ApiEphemeralUpdateSchema,
  type ApiUpdate,
  type ApiEphemeralUpdate
} from '@happy/protocol';

// Validate incoming update
const result = ApiUpdateSchema.safeParse(data);
if (result.success) {
  const update: ApiUpdate = result.data;
  switch (update.t) {
    case 'new-message':
      console.log('Session:', update.sid);
      console.log('Message:', update.message);
      break;
    case 'new-session':
      console.log('New session:', update.sid);
      break;
    // ... handle other types
  }
}
```

### CommonJS (happy-server)

```javascript
const { ApiUpdateSchema, ApiEphemeralUpdateSchema } = require('@happy/protocol');

// Same usage as ESM
const result = ApiUpdateSchema.safeParse(data);
```

## Available Exports

### Update Schemas (Persistent Events)

These are state changes that are stored and synced across devices.

| Schema | Type | Description |
|--------|------|-------------|
| `ApiUpdateSchema` | `ApiUpdate` | Discriminated union of all update types |
| `ApiUpdateNewMessageSchema` | `ApiUpdateNewMessage` | New encrypted message in session |
| `ApiUpdateNewSessionSchema` | `ApiUpdateNewSession` | New session created |
| `ApiDeleteSessionSchema` | `ApiDeleteSession` | Session archived/deleted |
| `ApiUpdateSessionStateSchema` | `ApiUpdateSessionState` | Session state change |
| `ApiUpdateAccountSchema` | `ApiUpdateAccount` | Account metadata update |
| `ApiNewMachineSchema` | `ApiNewMachine` | New machine registered |
| `ApiUpdateMachineStateSchema` | `ApiUpdateMachineState` | Machine state change |
| `ApiNewArtifactSchema` | `ApiNewArtifact` | New artifact created |
| `ApiUpdateArtifactSchema` | `ApiUpdateArtifact` | Artifact updated |
| `ApiDeleteArtifactSchema` | `ApiDeleteArtifact` | Artifact deleted |
| `ApiRelationshipUpdatedSchema` | `ApiRelationshipUpdated` | Friend relationship change |
| `ApiNewFeedPostSchema` | `ApiNewFeedPost` | Activity feed post |
| `ApiKvBatchUpdateSchema` | `ApiKvBatchUpdate` | KV store batch update |

### Ephemeral Schemas (Transient Events)

Real-time status updates that don't require persistence.

| Schema | Type | Description |
|--------|------|-------------|
| `ApiEphemeralUpdateSchema` | `ApiEphemeralUpdate` | Union of all ephemeral types |
| `ApiEphemeralActivityUpdateSchema` | `ApiEphemeralActivityUpdate` | Session activity status |
| `ApiEphemeralUsageUpdateSchema` | `ApiEphemeralUsageUpdate` | Token/cost usage |
| `ApiEphemeralMachineActivityUpdateSchema` | `ApiEphemeralMachineActivityUpdate` | Machine activity |
| `ApiEphemeralMachineStatusUpdateSchema` | `ApiEphemeralMachineStatusUpdate` | Machine online/offline |

### Payload Wrappers

Container schemas for WebSocket message sequencing.

| Schema | Type | Description |
|--------|------|-------------|
| `ApiUpdateContainerSchema` | `ApiUpdateContainer` | Sequenced update wrapper |
| `UpdatePayloadSchema` | `UpdatePayload` | Server-side wire format |
| `EphemeralPayloadSchema` | `EphemeralPayload` | Ephemeral wrapper |

### Common Types

Shared types used across the protocol.

| Schema | Type | Description |
|--------|------|-------------|
| `GitHubProfileSchema` | `GitHubProfile` | GitHub OAuth profile data |
| `ImageRefSchema` | `ImageRef` | Image/avatar reference |
| `RelationshipStatusSchema` | `RelationshipStatus` | User relationship enum |
| `UserProfileSchema` | `UserProfile` | Social user profile |
| `FeedBodySchema` | `FeedBody` | Activity feed content |
| `EncryptedContentSchema` | `EncryptedContent` | Encrypted payload wrapper |
| `VersionedValueSchema` | `VersionedValue` | Optimistic concurrency value |
| `NullableVersionedValueSchema` | `NullableVersionedValue` | Nullable versioned value |

## Type Guard Patterns

```typescript
import { ApiUpdateSchema, type ApiUpdate, type ApiUpdateType } from '@happy/protocol';

// Type narrowing with switch
function handleUpdate(update: ApiUpdate) {
  switch (update.t) {
    case 'new-message':
      // TypeScript knows: update is ApiUpdateNewMessage
      console.log(update.sid, update.message);
      break;
    case 'new-session':
      // TypeScript knows: update is ApiUpdateNewSession
      console.log(update.sid, update.title);
      break;
  }
}

// Available type discriminators
const updateTypes: ApiUpdateType[] = [
  'new-message', 'new-session', 'delete-session',
  'update-session-state', 'update-account', 'new-machine',
  // ... etc
];
```

## Building

```bash
# From packages/@happy/protocol
yarn build        # Build ESM + CJS output
yarn typecheck    # Type check without emitting
yarn clean        # Remove dist folder

# From monorepo root
yarn build:protocol
yarn typecheck:protocol
```

## Output Files

After building, the `dist/` folder contains:

| File | Format | Purpose |
|------|--------|---------|
| `index.js` | ESM | Modern ES modules |
| `index.cjs` | CommonJS | Legacy require() support |
| `index.d.ts` | TypeScript | ESM type declarations |
| `index.d.cts` | TypeScript | CJS type declarations |
| `index.js.map` | Sourcemap | ESM debugging |
| `index.cjs.map` | Sourcemap | CJS debugging |

## Peer Dependencies

This package requires `zod@^3.0.0` as a peer dependency. All consumer projects in the monorepo already have zod installed.

## Why This Package Exists

The Happy monorepo had ~95 duplicated types across four projects, causing schema drift bugs. The most notable was the `sessionId` vs `sid` field naming inconsistency (see HAP-383).

This package:
1. **Single source of truth** - All protocol types defined once
2. **Zod validation** - Runtime validation matches TypeScript types
3. **Dual format** - Works with both ESM and CommonJS projects
4. **Migration path** - Projects can adopt gradually

## Migration Guide

When migrating existing code to use `@happy/protocol`:

1. **Import from package** instead of local types:
   ```typescript
   // Before
   import { ApiUpdate } from '../api/types';

   // After
   import { ApiUpdate } from '@happy/protocol';
   ```

2. **Remove duplicate definitions** from local files

3. **Run typecheck** to catch any mismatches

See individual project integration issues (HAP-385 through HAP-388) for detailed migration steps.

## Related Issues

- **HAP-383**: RFC - Shared Types Package (complete)
- **HAP-384**: Set up yarn workspaces (this package)
- **HAP-385**: Integrate in happy-app
- **HAP-386**: Integrate in happy-cli
- **HAP-387**: Integrate in happy-server-workers
- **HAP-388**: Integrate in happy-server
- **HAP-389**: CI validation

## License

MIT
