export function removeUnderscores(s: string): string {
  return s.replace(RegExp("_", "g"), "");
}
