export function stripCharacters(s: string): string {
  return s.replace(RegExp("_", "g"), "");
}
