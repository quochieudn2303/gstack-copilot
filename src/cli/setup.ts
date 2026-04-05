import { Command } from "commander";
import pc from "picocolors";

import { runSetupInstall } from "../setup/install.js";

export interface SetupCommandOptions {
  target?: string;
}

export const setupCommand = new Command("setup")
  .description("Install or verify the checked-in Copilot skills")
  .option("-t, --target <dir>", "Target directory to install the skills into")
  .action(async (options: SetupCommandOptions) => {
    const result = await runSetupInstall({
      targetRoot: options.target,
    });

    console.error(
      pc.green(
        `Setup complete: ${result.skills.join(", ")} -> ${result.targetSkillsDir}`,
      ),
    );
  });
