import { readFile } from "node:fs/promises";

import type { CopilotFrontmatter } from "../schemas/copilot.js";
import { transformContent } from "./content.js";
import { transformFrontmatter } from "./frontmatter.js";
import { generateOutput } from "./output.js";
import { ConversionError, parseSkill, type ParsedSkill } from "./parse.js";

export { ConversionError } from "./parse.js";

export interface ConversionResult {
  frontmatter: CopilotFrontmatter;
  content: string;
  output: string;
  source: ParsedSkill;
}

export class ConversionPipeline {
  convert(source: string, filepath: string): ConversionResult {
    const parsed = parseSkill(source, filepath);
    const frontmatter = transformFrontmatter(parsed.data);
    const content = transformContent(parsed.content, filepath);
    const output = generateOutput(frontmatter, content);

    return { frontmatter, content, output, source: parsed };
  }

  async convertFile(filepath: string): Promise<ConversionResult> {
    const source = await readFile(filepath, "utf8");
    return this.convert(source, filepath);
  }
}

const defaultPipeline = new ConversionPipeline();

export function convertSkill(source: string, filepath: string): ConversionResult {
  return defaultPipeline.convert(source, filepath);
}

export function convertSkillFile(filepath: string): Promise<ConversionResult> {
  return defaultPipeline.convertFile(filepath);
}
