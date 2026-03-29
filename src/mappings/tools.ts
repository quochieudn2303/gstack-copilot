export const TOOL_MAPPINGS: Record<string, string> = {
  Agent: "Task",
};

export function mapTool(tool: string): string {
  return TOOL_MAPPINGS[tool] ?? tool;
}

export function mapTools(tools: string[]): string[] {
  return tools.map(mapTool);
}
