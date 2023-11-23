/**
 * Checks if a domain name is a valid ENS domain.
 * TODO: find a way to join this function the the one from validate
 * @param ensDomain - The domain name to check.
 * @returns - True if the domain name is valid, false otherwise.
 */
export function isEnsDomain(ensDomain: string): boolean {
  // The regex checks for valid ENS subdomains. Each subdomain part should start with a letter or number,
  // can contain hyphens, and must end with a letter or number. Each subdomain part is separated by a dot.
  const regex = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.eth$/;

  return regex.test(ensDomain);
}
