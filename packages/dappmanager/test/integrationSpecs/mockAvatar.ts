import fs from "fs";

/**
 * 300x300 px PNG of single uniform #ff0000 (red) color
 */
const mockAvatarHex =
  "89504e470d0a1a0a0000000d494844520000012c0000012c010300000043b31c3600000003504c5445ff000019e2093700000022494441546843edc13101000000c2a0f54f6d0a3fa0000000000000000000000078192db40001df125aea0000000049454e44ae426082";

export function saveMockAvatarTo(filepath: string): void {
  fs.writeFileSync(filepath, Buffer.from(mockAvatarHex, "hex"));
}
