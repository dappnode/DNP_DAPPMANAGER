export function markdownList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}
