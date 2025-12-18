/**
 * Artifact-related update schemas
 *
 * Handles: new-artifact, update-artifact, delete-artifact
 */

import { z } from 'zod';
import { VersionedValueSchema } from '../common';

/**
 * New artifact update
 *
 * Sent when a new artifact (file/output) is created.
 */
export const ApiNewArtifactSchema = z.object({
    t: z.literal('new-artifact'),
    artifactId: z.string(),
    header: z.string(), // Encrypted header
    headerVersion: z.number(),
    body: z.string().optional(), // Encrypted body (optional for header-only artifacts)
    bodyVersion: z.number().optional(),
    dataEncryptionKey: z.string(),
    seq: z.number(),
    createdAt: z.number(),
    updatedAt: z.number(),
});

export type ApiNewArtifact = z.infer<typeof ApiNewArtifactSchema>;

/**
 * Update artifact
 *
 * Sent when artifact header or body changes.
 */
export const ApiUpdateArtifactSchema = z.object({
    t: z.literal('update-artifact'),
    artifactId: z.string(),
    header: VersionedValueSchema.optional(),
    body: VersionedValueSchema.optional(),
});

export type ApiUpdateArtifact = z.infer<typeof ApiUpdateArtifactSchema>;

/**
 * Delete artifact
 *
 * Sent when an artifact is deleted.
 */
export const ApiDeleteArtifactSchema = z.object({
    t: z.literal('delete-artifact'),
    artifactId: z.string(),
});

export type ApiDeleteArtifact = z.infer<typeof ApiDeleteArtifactSchema>;
