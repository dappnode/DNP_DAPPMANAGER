import shell from "./shell";

/**
 * Verify a compressed .xz file
 *
 * @param PATH file path: ./dir/file.tar.xz
 * @returns:
 * - If the `xz -t` succeeds, returns true
 * - If the file is missing, returns false
 * - If the file is not a .xz, returns false
 * - If the file is corrupted, returns false
 */
export default function verifyXz(xzFilePath: string): Promise<{
  success: boolean;
  message: string;
}> {
  return shell(`xz -t ${xzFilePath}`)
    .then(() => ({
      success: true,
      message: ""
    }))
    .catch((e: Error) => ({
      success: false,
      message: e.message
    }));
}
