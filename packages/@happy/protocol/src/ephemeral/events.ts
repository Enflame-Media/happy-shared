/**
 * Ephemeral event schemas
 *
 * Ephemeral events are transient status updates that don't need persistence.
 * These are real-time indicators of activity (typing, presence, etc.)
 */

import { z } from 'zod';

/**
 * Session activity update
 *
 * Real-time indicator of session activity and thinking state.
 */
export const ApiEphemeralActivityUpdateSchema = z.object({
    type: z.literal('activity'),
    id: z.string(), // Session ID
    active: z.boolean(),
    activeAt: z.number(),
    thinking: z.boolean(),
});

export type ApiEphemeralActivityUpdate = z.infer<typeof ApiEphemeralActivityUpdateSchema>;

/**
 * Token/cost usage update
 *
 * Real-time cost and token tracking for a session.
 */
export const ApiEphemeralUsageUpdateSchema = z.object({
    type: z.literal('usage'),
    id: z.string(), // Session ID
    key: z.string(), // Usage key/identifier
    timestamp: z.number(),
    tokens: z.object({
        total: z.number(),
        input: z.number(),
        output: z.number(),
        cache_creation: z.number(),
        cache_read: z.number(),
    }),
    cost: z.object({
        total: z.number(),
        input: z.number(),
        output: z.number(),
    }),
});

export type ApiEphemeralUsageUpdate = z.infer<typeof ApiEphemeralUsageUpdateSchema>;

/**
 * Machine activity update
 *
 * Real-time indicator of machine/daemon activity.
 */
export const ApiEphemeralMachineActivityUpdateSchema = z.object({
    type: z.literal('machine-activity'),
    id: z.string(), // Machine ID
    active: z.boolean(),
    activeAt: z.number(),
});

export type ApiEphemeralMachineActivityUpdate = z.infer<typeof ApiEphemeralMachineActivityUpdateSchema>;

/**
 * Machine online status update
 *
 * Real-time indicator of machine online/offline status.
 */
export const ApiEphemeralMachineStatusUpdateSchema = z.object({
    type: z.literal('machine-status'),
    machineId: z.string(),
    online: z.boolean(),
    timestamp: z.number(),
});

export type ApiEphemeralMachineStatusUpdate = z.infer<typeof ApiEphemeralMachineStatusUpdateSchema>;

/**
 * Union of all ephemeral update types
 */
export const ApiEphemeralUpdateSchema = z.union([
    ApiEphemeralActivityUpdateSchema,
    ApiEphemeralUsageUpdateSchema,
    ApiEphemeralMachineActivityUpdateSchema,
    ApiEphemeralMachineStatusUpdateSchema,
]);

export type ApiEphemeralUpdate = z.infer<typeof ApiEphemeralUpdateSchema>;

/**
 * Ephemeral update type discriminator values
 */
export type ApiEphemeralUpdateType = ApiEphemeralUpdate['type'];
