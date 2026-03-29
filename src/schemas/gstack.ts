import { z } from "zod";

export const GstackFrontmatter = z
  .object({
    name: z.string().min(1),
    "preamble-tier": z.number().int().min(1).max(4),
    version: z.string().optional(),
    description: z.string(),
    "allowed-tools": z.array(z.string()),
  })
  .strict();

export type GstackFrontmatter = z.infer<typeof GstackFrontmatter>;
