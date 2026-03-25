const LEGACY_BASE_PATH = "/staking";

/**
 * Prefixes a legacy route fragment with the mounted legacy app base path.
 *
 * Examples:
 * - withLegacyBase("packages/my") => "/staking/packages/my"
 * - withLegacyBase("/packages/my") => "/staking/packages/my"
 * - withLegacyBase("") => "/staking"
 */
export function withLegacyBase(path = ""): string {
  const normalized = path.replace(/^\/+/, "");
  return normalized ? `${LEGACY_BASE_PATH}/${normalized}` : LEGACY_BASE_PATH;
}

export { LEGACY_BASE_PATH };
