export function validateEthereumAddress(value?: string): string | null {
  if (value && !/^0x[0-9a-fA-F]{40}$/.test(value)) return "Invalid address";
  return null;
}

export function validateGraffiti(value?: string): string | null {
  // It must be not more than 32 characters long
  if (value && value.length > 32)
    return "Graffiti must be less than 32 characters";
  return null;
}
