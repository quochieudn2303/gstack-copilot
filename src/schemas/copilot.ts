import { z } from "zod";

export const CopilotFrontmatter = z
  .object({
    name: z.string().min(1),
    description: z.string(),
    "argument-hint": z.string().optional(),
    "allowed-tools": z.string(),
  })
  .strict();

export type CopilotFrontmatter = z.infer<typeof CopilotFrontmatter>;
