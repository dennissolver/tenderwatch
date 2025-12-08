import { z } from "zod";

// Watch schemas
export const createWatchSchema = z.object({
  name: z.string().min(1).max(100),
  keywordsMust: z.array(z.string()).default([]),
  keywordsBonus: z.array(z.string()).default([]),
  keywordsExclude: z.array(z.string()).default([]),
  regions: z.array(z.string()).default([]),
  valueMin: z.number().int().positive().optional(),
  valueMax: z.number().int().positive().optional(),
  includeUnspecifiedValue: z.boolean().default(true),
  tenderTypes: z.array(z.string()).default([]),
  minResponseDays: z.number().int().positive().optional(),
  preferredSectors: z.array(z.string()).default([]),
  preferredBuyers: z.array(z.string()).default([]),
  certificationsHeld: z.array(z.string()).default([]),
  sensitivity: z.enum(["strict", "balanced", "adventurous"]).default("balanced"),
  deliveryMethod: z.enum(["instant", "daily", "weekly"]).default("daily"),
  detailLevel: z.enum(["headlines", "standard", "deep"]).default("standard")
});

export type CreateWatchInput = z.infer<typeof createWatchSchema>;

// Linked account schemas
export const linkAccountSchema = z.object({
  site: z.string(),
  username: z.string().min(1),
  password: z.string().min(1)
});

export type LinkAccountInput = z.infer<typeof linkAccountSchema>;

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
