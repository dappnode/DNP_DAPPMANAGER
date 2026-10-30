/** @deprecated Plain HTTP mirrors cannot authenticate release contents. */
export async function mirrorProviderGet(): Promise<{ enabled: boolean }> {
  return { enabled: false };
}
