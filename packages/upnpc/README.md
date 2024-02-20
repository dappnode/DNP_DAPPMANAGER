# upnpc package

## Overview

❌ This package does not have calls exports

This package contains the implementation used to interact with the router via UPnP. Its main functionalities are:

- Discovering the router
- Opening ports
- Closing ports

## Testing

- Unit testing: `yarn test`

## Todo

- [ ] Review its current status, its has been long time without support
- [ ] Implement a way to disable this module if there is no router (dappnode in cloud)
- [ ] Consider renaming this module to **ports** and include all the logic in the dappmanager calls `portsStatusGet` and `portsOpenGet` to such module. Also the logic from the nat renewal daemon function `getPortsToOpen` should be moved to this module.

## Contact

- Responsibles:
  - @dappnodedev
