export function isEmpty(hash: string): boolean {
  return hash === "0x" || parseInt(hash) === 0;
}
