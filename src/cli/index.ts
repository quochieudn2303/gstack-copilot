#!/usr/bin/env node

import { Command } from "commander";
import pc from "picocolors";

import { convertCommand } from "./convert.js";

const program = new Command()
  .name("gstack-copilot")
  .description("Convert gstack skills to Copilot CLI format")
  .version("0.1.0");

program.addCommand(convertCommand);

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(pc.red(`Unhandled error: ${message}`));
  process.exitCode = 1;
});
