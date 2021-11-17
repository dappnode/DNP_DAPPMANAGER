export function isLink(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}
