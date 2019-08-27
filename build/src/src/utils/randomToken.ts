import { promisify } from "util";
import { randomBytes } from "crypto";

const randomBytesAsync = promisify(randomBytes);

/**
 * Generates a random hex string
 *
 * @param {Integer} byteLength byte length
 * @returns {string} hex string: i.e.
 *   adf572278b5fab3ee2b920a85ae86bd9d964b4f3b7402c35023498a89afe4da0
 */
export default function randomToken(byteLength: number) {
  return randomBytesAsync(byteLength || 32).then((buffer: Buffer) =>
    buffer.toString("hex")
  );
}
