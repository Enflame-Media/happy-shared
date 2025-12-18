/**
 * Message-related update schemas
 *
 * Handles: new-message, delete-session (session lifecycle)
 */

import { z } from 'zod';
import { EncryptedContentSchema } from '../common';

/**
 * API Message schema - encrypted message structure
 *
 * Messages are stored encrypted; the server cannot read content.
 */
export const ApiMessageSchema = z.object({
    id: z.string(),
    seq: z.number(),
    localId: z.string().nullish(),
    content: EncryptedContentSchema,
    createdAt: z.number(),
});

export type ApiMessage = z.infer<typeof ApiMessageSchema>;

/**
 * New message update
 *
 * CRITICAL: Uses 'sid' (not 'sessionId') per client expectation.
 * This was the source of the bug that motivated HAP-383.
 */
export const ApiUpdateNewMessageSchema = z.object({
    t: z.literal('new-message'),
    sid: z.string(), // Session ID - MUST be 'sid', not 'sessionId'
    message: ApiMessageSchema,
});

export type ApiUpdateNewMessage = z.infer<typeof ApiUpdateNewMessageSchema>;

/**
 * Delete session update
 *
 * Sent when a session is archived or deleted.
 */
export const ApiDeleteSessionSchema = z.object({
    t: z.literal('delete-session'),
    sid: z.string(), // Session ID
});

export type ApiDeleteSession = z.infer<typeof ApiDeleteSessionSchema>;
