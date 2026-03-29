import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

import { Command } from "commander";
import pc from "picocolors";

import { ConversionError, convertSkillFile } from "../pipeline/index.js";

export interface ConvertCommandOptions {
  output?: string;
  outputDir?: string;
  dryRun?: boolean;
}

export const convertCommand = new Command("convert")
  .description("Convert a gstack SKILL.md to Copilot format")
  .argument("<input>", "Path to the source gstack SKILL.md file")
  .option("-o, --output <path>", "Write the converted skill to a file")
  .option("-d, --output-dir <dir>", "Write the converted skill into a directory")
  .option("--dry-run", "Print the converted output without writing a file")
  .action(async (input: string, options: ConvertCommandOptions) => {
    try {
      const result = await convertSkillFile(input);

      if (options.dryRun) {
        console.error(pc.blue(`Dry run: ${input}`));
        console.log(result.output);
        return;
      }

      if (options.output) {
        await mkdir(dirname(options.output), { recursive: true });
        await writeFile(options.output, result.output, "utf8");
        console.error(pc.green(`Written: ${options.output}`));
      } else if (options.outputDir) {
        await mkdir(options.outputDir, { recursive: true });
        const outputPath = join(options.outputDir, basename(input));
        await writeFile(outputPath, result.output, "utf8");
        console.error(pc.green(`Written: ${outputPath}`));
      } else {
        console.log(result.output);
      }

      console.error(pc.green(`Converted ${input} -> ${result.frontmatter.name}`));
    } catch (error) {
      if (error instanceof ConversionError) {
        const location =
          typeof error.line === "number" ? `:${error.line}` : "";
        console.error(
          pc.red(
            `Conversion failed${error.filepath ? ` (${error.filepath}${location})` : ""}: ${error.message}`,
          ),
        );
        process.exitCode = 1;
        return;
      }

      throw error;
    }
  });
