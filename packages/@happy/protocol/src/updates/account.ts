/**
 * Account-related update schemas
 *
 * Handles: update-account
 */

import { z } from 'zod';
import { GitHubProfileSchema, ImageRefSchema, NullableVersionedValueSchema } from '../common';

/**
 * Update account
 *
 * Sent when user account settings or profile changes.
 */
export const ApiUpdateAccountSchema = z.object({
    t: z.literal('update-account'),
    id: z.string(),
    settings: NullableVersionedValueSchema.nullish(),
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
    avatar: ImageRefSchema.nullish(),
    github: GitHubProfileSchema.nullish(),
});

export type ApiUpdateAccount = z.infer<typeof ApiUpdateAccountSchema>;
