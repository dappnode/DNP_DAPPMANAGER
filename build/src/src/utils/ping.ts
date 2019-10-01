import shell from "./shell";

const count = 5;
const max = 3;

/**
 * Checks if a given IP resolves
 *
 * @param {string} ip
 * @return {Boolean} resolves
 */
export default async function ping(ip: string): Promise<boolean> {
  let i = 0;
  while (i++ < max) {
    // The command ping returns code 0 if some package was successful
    // The command ping returns code != 0 if no package was successful
    const resolved = await shell(`ping -c ${count} ${ip}`)
      .then(() => true)
      .catch(() => false);
    if (resolved) return true;
  }
  return false;
}
