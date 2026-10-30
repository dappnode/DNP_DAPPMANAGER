# Migrations package

## Overview

❌ This package has no calls exports.

This package contains migrations that are executed on dappmanager startup.

The Hoodi MEV-Boost relay migration runs at startup. Mainnet will get its own
migration when Brain's Mainnet presets are available. The Hoodi handoff stages
comma-separated preset IDs in the existing Hoodi Web3Signer's
`brain.BUILDER_IDS` environment and applies them through the package environment
operation. It reads enabled MEV-Boost's `mev-boost.RELAYS`
and requires every URL to match a supported Hoodi endpoint. Unsupported or mixed
selections are logged and skipped; other networks currently have no mapping.
MEV-Boost, bid limits, and validator client options are left intact.

Startup migrations run every time and are not awaited by daemons. The migration
registers its own `packagesModified` listener before its initial attempt, with no
changes to the staking daemon. It serializes startup and lifecycle retries,
skips missing/installing packages, and preserves nonempty staged IDs without another recreation. No
signer is provisioned. The installer preserves staged IDs across signer updates,
including intermediate releases without the variable. Brain alone imports
settings for existing validators and manages its database and completion marker;
later changes and future validators are outside this handoff.

Signer-package follow-up: declare `BUILDER_IDS: ""` on the Hoodi `brain` service
and release the Brain image containing the import hook, retaining its existing
network and persistent data volume. Keep the default empty to avoid importing
defaults into a new validator database.

## Testing

- Unit tests: `yarn test`
- Integration tests: `yarn test:int`

## Todo

- [ ] Complete the integration tests for the migrations package.
- [ ] Remove legacy migrations
- [ ] Try to remove the `Dockerode` dependency, it should be located only in `docker` modules.

## Contact

- Responsibles:
  - @pablomendezroyo
  - @Marketen
