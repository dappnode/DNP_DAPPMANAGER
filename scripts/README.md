# Migrate Docker address allocation

Dappnode keeps DNS at `10.20.0.2` / `172.33.1.2` and Dappmanager at
`172.33.1.7`. Ordinary containers use Docker DNS aliases and dynamic addresses.
`packages/params/src/dockerNetworkPolicy.json` defines the allocation policy:

| Network           | Subnet        | Dynamic pool    | Fixed core addresses               |
| ----------------- | ------------- | --------------- | ---------------------------------- |
| dnprivate_network | 10.20.0.0/24  | 10.20.0.128/25  | DNS 10.20.0.2                      |
| dncore_network    | 172.33.0.0/16 | 172.33.128.0/17 | DNS 172.33.1.2, manager 172.33.1.7 |

The installer uses the same legacy-network pool. Fresh networks receive the
policy immediately. Upgrading Dappmanager only warns about old networks: it does
**not** rebuild them during startup or its periodic network checks.

## Existing installations

Run the wrapper on the host, with Docker access, from this repository or a copy
of `scripts/migrate-docker-networks.sh`. The installed Dappmanager image must
include this migration. To stage a candidate image, set
`DAPPNODE_NETWORK_MIGRATION_IMAGE` to that image's tag or immutable ID.

```sh
sh scripts/migrate-docker-networks.sh plan
sh scripts/migrate-docker-networks.sh apply
sh scripts/migrate-docker-networks.sh status
```

`plan` resolves installed Compose configurations, including overrides and
interpolation, and inventories running **and stopped** containers. A fixed
address is retained only if required by core policy or declared in Compose.
Observed dynamic addresses are never promoted to static assignments. This also
removes stale dynamic-address pins on Dappnode's public and staking networks without
recreating those networks. Explicit custom addresses must remain outside the new
core-network allocation pool; conflicting or ambiguous configurations block the
migration before any container is stopped. Unmanaged attached containers,
unsupported network configurations, and insufficient capacity also block it.

The private pool has a conservative limit of 126 dynamic attachments, counting
stopped containers. Additional IPAM reservations lower that limit. A larger
installation must choose and validate a separate subnet/capacity migration;
this tool never silently changes its subnet or discards endpoints.

`apply` requires an unchanged saved plan. Schedule a maintenance window: the
operation gracefully stops affected containers, replaces the two legacy bridges
when necessary, restores aliases/addressing intent, and starts previously running
containers. The core coordinator and other Docker controllers are stopped before
Dappmanager; all affected containers must remain stopped before network changes.
Ordinary services are started before the manager and core coordinator, preventing
their startup reconciliation from racing network restoration. Successfully
completed one-shot jobs are accepted as completed and are not needlessly rerun.
Container IDs, writable layers, images, mounts, keys, restart policies and
unrelated network attachments are retained. Previously stopped containers stay
stopped. Failure to stop a container aborts before network changes. Docker first
requests graceful shutdown; legacy images which require Docker's timeout/forced
stop are recorded in the journal and worker log. Container files are never copied
or recreated, retaining the same recovery semantics as an ordinary Docker restart.
Dappmanager handles Docker's default SIGTERM as well as SIGINT. Dynamic addresses can
change; applications must use their existing DNS aliases.

## Recovery

The wrapper starts a detached, network-less worker named
`DAppNodeTool-network-migration`. It inherits Dappmanager's configuration mounts
and Docker socket; stopping the manager does not stop the worker. A private,
atomically written journal is stored in the `dappnode-network-migration-v1`
Docker volume. Never delete this volume during recovery.

```sh
docker logs DAppNodeTool-network-migration
sh scripts/migrate-docker-networks.sh resume
# Or restore the original network configuration and running-service set:
sh scripts/migrate-docker-networks.sh rollback
# Explicitly retry the approved forward migration from its original journal:
sh scripts/migrate-docker-networks.sh retry
```

Ordinary failures trigger rollback. After process/daemon interruption, `resume`
replays the incomplete operation from the original journal. An interrupted
rollback resumes as a rollback. The same migration image/policy and unchanged
Compose network intent are required; keep the image ID and journal until the
node has been validated. The wrapper refuses a second active worker. Original
dynamic addresses may change during rollback, while original static intent and
aliases are restored. A completed `resume` verifies the result without repeating
the outage. Use a new `DAPPNODE_NETWORK_MIGRATION_STATE_VOLUME` only for a new,
separately reviewed migration; do not overwrite a previous recovery journal.
After a verified rollback, run `plan` and `apply` again to retry. The previous
rollback journal is archived privately in the same state volume before a new
operation begins.
When a later release changes the allocation policy, a completed journal for the
previous policy can likewise be archived after a new plan is approved. Completed
migrations for the same policy are verified instead of repeated.
`retry` explicitly chooses forward recovery using the original approved plan,
including its running-service set. This is useful when rollback restores a legacy
address collision; it does not accept a new snapshot of partially migrated state.

After migration, check DNS, dashboard, VPN, execution/consensus sync, signer
health, and successful validator attestations. Then validate Docker restarts.
If a service was already stopped by a previous failed Docker startup, its stopped
state is preserved; explicitly start it after checking the saved plan.

## Tests

The migration and tests run directly as TypeScript on Node 24 with built-in type
stripping. `yarn typecheck:network-migration` checks both using `tsc --noEmit` and
`erasableSyntaxOnly`; `yarn build` includes this check. They do not require a
runtime loader or the manager process.

```sh
yarn typecheck:network-migration
yarn test:network-migration
yarn test:network-migration:int
```

The integration test creates isolated fixture networks and containers on the
current Docker daemon. It reproduces the old collision, tests migration,
interruption/resume, interrupted rollback, preserved writable-layer data, aliases,
custom statics and unrelated attachments, and starts ordinary packages before
the fixed-address service. Fixtures are removed afterward. Docker-daemon restart
tests affect the whole machine and belong in an explicitly authorized host test
window, not an ordinary CI unit test.
