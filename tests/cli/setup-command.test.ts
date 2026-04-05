import { describe, expect, it } from "vitest";

import { setupCommand } from "../../src/cli/setup.js";

describe("setup CLI command", () => {
  it("registers the setup command with the expected name", () => {
    expect(setupCommand.name()).toBe("setup");
    expect(setupCommand.description()).toContain("Install");
  });
});
