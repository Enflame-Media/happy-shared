/**
 * @happy/protocol - Shared protocol types for Happy monorepo
 *
 * This package provides Zod schemas and TypeScript types for the Happy sync protocol.
 * It serves as the single source of truth for:
 * - Update events (persistent state changes)
 * - Ephemeral events (real-time status updates)
 * - Payload wrappers (sequencing containers)
 * - Common types (GitHubProfile, ImageRef, etc.)
 *
 * @example
 * ```typescript
 * import { ApiUpdateSchema, type ApiUpdate } from '@happy/protocol';
 *
 * // Validate incoming update
 * const result = ApiUpdateSchema.safeParse(data);
 * if (result.success) {
 *     const update: ApiUpdate = result.data;
 *     switch (update.t) {
 *         case 'new-message':
 *             console.log('Session:', update.sid);
 *             break;
 *         // ...
 *     }
 * }
 * ```
 *
 * @packageDocumentation
 */

// Common types used across the protocol
export * from './common';

// Update event schemas (persistent)
export * from './updates';

// Ephemeral event schemas (transient)
export * from './ephemeral';

// Payload wrapper schemas
export * from './payloads';
