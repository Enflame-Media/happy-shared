/**
 * Session-related update schemas
 *
 * Handles: new-session, update-session
 */

import { z } from 'zod';
import { NullableVersionedValueSchema } from '../common';

/**
 * New session update
 *
 * Sent when a new Claude Code session is created.
 * Contains initial encrypted metadata and agent state.
 */
export const ApiUpdateNewSessionSchema = z.object({
    t: z.literal('new-session'),
    id: z.string(), // Session ID
    seq: z.number(),
    metadata: z.string(), // Encrypted metadata
    metadataVersion: z.number(),
    agentState: z.string().nullable(), // Encrypted agent state
    agentStateVersion: z.number(),
    dataEncryptionKey: z.string().nullable(), // Base64 encoded
    active: z.boolean(),
    activeAt: z.number(),
    createdAt: z.number(),
    updatedAt: z.number(),
});

export type ApiUpdateNewSession = z.infer<typeof ApiUpdateNewSessionSchema>;

/**
 * Update session state
 *
 * Sent when session metadata or agent state changes.
 * Both fields are optional - only changed fields are included.
 */
export const ApiUpdateSessionStateSchema = z.object({
    t: z.literal('update-session'),
    id: z.string(),
    agentState: NullableVersionedValueSchema.nullish(),
    metadata: NullableVersionedValueSchema.nullish(),
});

export type ApiUpdateSessionState = z.infer<typeof ApiUpdateSessionStateSchema>;
