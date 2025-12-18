/**
 * Machine-related update schemas
 *
 * Handles: new-machine, update-machine
 */

import { z } from 'zod';
import { VersionedValueSchema } from '../common';

/**
 * New machine update
 *
 * Sent when a new CLI machine is registered.
 */
export const ApiNewMachineSchema = z.object({
    t: z.literal('new-machine'),
    machineId: z.string(),
    seq: z.number(),
    metadata: z.string(), // Encrypted metadata
    metadataVersion: z.number(),
    daemonState: z.string().nullable(), // Encrypted daemon state
    daemonStateVersion: z.number(),
    dataEncryptionKey: z.string().nullable(), // Base64 encoded
    active: z.boolean(),
    activeAt: z.number(),
    createdAt: z.number(),
    updatedAt: z.number(),
});

export type ApiNewMachine = z.infer<typeof ApiNewMachineSchema>;

/**
 * Update machine state
 *
 * Sent when machine metadata or daemon state changes.
 */
export const ApiUpdateMachineStateSchema = z.object({
    t: z.literal('update-machine'),
    machineId: z.string(),
    metadata: VersionedValueSchema.optional(),
    daemonState: VersionedValueSchema.optional(),
    active: z.boolean().optional(),
    activeAt: z.number().optional(),
});

export type ApiUpdateMachineState = z.infer<typeof ApiUpdateMachineStateSchema>;
