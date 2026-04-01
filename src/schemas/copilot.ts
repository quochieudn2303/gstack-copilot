import { z } from "zod";

export const CopilotFrontmatter = z
  .object({
    name: z.string().min(1),
    description: z.string(),
    "allowed-tools": z.string().optional(),
    "user-invocable": z.boolean().optional(),
    "disable-model-invocation": z.boolean().optional(),
    // Compatibility-only: retained because earlier converter output and some hosts
    // may still accept it, but Phase 3 no longer assumes it is documented.
    "argument-hint": z.string().optional(),
  })
  .strict();

export type CopilotFrontmatter = z.infer<typeof CopilotFrontmatter>;
