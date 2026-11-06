# admin-ui package

## Overview

## Testing

## Todo

## Contact

- Responsibles:
  - @pablomendezroyo
  - @GiselleNessi

## Tailscale browser sign-in

The VPN page consumes the reporter's `tailscale.status` string through the existing `packageGet` subscription. Reports expire after 90 seconds even with no updates. The package API exposes no server clock, so freshness assumes the browser and Dappnode clocks agree within five seconds; reports further in the future fail closed. The observation time does not describe when Tailscale expires a login link.

Run `yarn workspace @dappnode/admin-ui test:tailscale` for the focused parser and component tests. Run `yarn workspace @dappnode/dappmanager test:file test/unit/api/tailscaleDataSend.test.ts` for the existing data-send/source-IP path with Docker response fixtures.

For local review, run `yarn mock-standalone` and open `/vpn/tailscale`. The Tailscale fixture contains a synthetic sign-in link and expires after 90 seconds; reload to reset the sample timestamp. Change `installedData.packageSentData` in `src/__mock-backend__/data/dnps/tailscale.ts` to review other states. The fixture uses the same mock package lookup as other packages. It does not perform authentication or add a background refresh mechanism.

Source attribution remains unchanged: Compose attaches both services to `dncore_network`, `listPackageContainers` includes each service separately, and `getDnpFromIp` matches the sender's address on that network. The reporter uses `dappmanager.dappnode`, the manager's alias on `dncore_network`; the newer network uses `dappmanager.dappnode.private`. The focused backend test exercises Docker network parsing, reporter attribution, string storage, and package update emission.

A real Dappnode/tailnet test is still required: install without a key, confirm reporter delivery from its actual container IP, open the sign-in link, authenticate, verify automatic status updates and link removal, approve subnet routes/configure DNS, then access an internal service from another tailnet device. Also restart each service and disconnect the reporter to check stale-status removal. Authentication alone does not prove routing or DNS access.
