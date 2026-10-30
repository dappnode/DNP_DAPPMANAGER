<p align="center"><a href="https://github.com/dappnode/DAppNode"><img width="400" title="DAPPMANAGER" src='banner-dappmanager.png' /></a></p>

[![Website dappnode.com](https://img.shields.io/badge/Website-dappnode.io-brightgreen.svg)](https://dappnode.com/)
[![Documentation Wiki](https://img.shields.io/badge/Documentation-Wiki-brightgreen.svg)](https://docs.dappnode.io)
[![GIVETH Campaign](https://img.shields.io/badge/GIVETH-Campaign-1e083c.svg)](https://giveth.io/project/dappnode)
[![Discord Dappnode](https://img.shields.io/discord/747647430450741309?label=Discord&logo=Discord&style=plastic)](https://discord.gg/dappnode)
[![Twitter Follow](https://img.shields.io/twitter/follow/espadrine.svg?style=social&label=Follow)](https://twitter.dappnode.io)

The **DNP_DAPPMANAGER** handles the Dappnode core DNPs and any user installed DNPs. It also performs maintenance checks.

- :bust_in_silhouette: For user / usage documentation go to the [user guide](https://docs.dappnode.io/docs/user/getting-started/choose-your-path)
- :wrench: For developers check the [technical documentation](https://docs.dappnode.io/docs/dev)
- :speech_balloon: For feedback and reporting problems please [submit an issue](https://github.com/dappnode/dappnode/issues/new) or contact us on [Discord](https://discord.gg/dappnode)

It is an AragonApp whose repo is deployed at this address: [0x0c564ca7b948008fb324268d8baedaeb1bd47bce](https://etherscan.io/address/0x0c564ca7b948008fb324268d8baedaeb1bd47bce) and whose ENS address is: [dappmanager.dnp.dappnode.eth](https://etherscan.io/enslookup?q=dappmanager.dnp.dappnode.eth])

## Package download integrity

Release directories and files are authenticated against their IPFS CIDs. Every CAR
block consumed by UnixFS is hashed before decoding. Image downloads are staged on
disk and replace the destination only after verification succeeds. Cached CARs are
verified again on reuse; a cached tarball alone is never trusted.

The former plain HTTP content-mirror protocol is deprecated because it supplied no
proof that its files belonged to the requested CID. Existing mirror settings are
ignored and migrated to disabled. Packages use the configured local or remote IPFS
gateways, which must support raw DAG-PB and CAR responses. Publisher signature
checks apply regardless of where the bytes are downloaded.

## Registry chain verification

Normal installs, automatic/core upgrades, and resolved dependencies require an
Ethereum mainnet registry record verified by the bundled Helios light client.
ENS resolution and APM contract calls execute locally against account, bytecode,
and storage proofs from one verified finalized block. The execution and consensus
RPCs supply data; their responses alone cannot authorize a release. Finalized
blocks older than 30 minutes are rejected. Existing signature-bypass and
resolver-bypass options do not bypass chain verification.

Before the first registry install, configure these Dappmanager container variables:

| Variable                         | Purpose                                                                                                                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UPDATE_CHAIN_CHECKPOINT`        | Operator-trusted mainnet **beacon block root**, less than 14 days old. This is the root of trust; obtain and verify it independently of the execution RPC. An execution block hash is not a beacon checkpoint. |
| `UPDATE_CHAIN_CONSENSUS_RPC_URL` | Beacon API supporting the Ethereum light-client endpoints. Defaults to the local mainnet beacon service.                                                                                                       |
| `UPDATE_CHAIN_EXECUTION_RPC_URL` | Execution RPC supporting `eth_getProof` and proof-backed contract reads. Defaults to `ETH_MAINNET_RPC_URL_REMOTE`, then `https://web3.dappnode.net`.                                                           |

Helios is built from source at revision
`2af9b41887e069144ee56cd710f3ddca195473f8` (0.12.0), with the archive checksum
pinned in the Dockerfile. There is no runtime binary download and its RPC binds
only to loopback inside Dappmanager. `UPDATE_CHAIN_BINARY` can point development
runs at a locally built copy of that binary.

Verified checkpoint progress is saved under `dnp_repo/update-light-client` in the
existing persistent volume and reused on restart. Changing
`UPDATE_CHAIN_CHECKPOINT` explicitly refreshes the operator trust anchor. After an
extended offline period, supply a new independently verified checkpoint and
restart Dappmanager. The helper enforces the 14-day bootstrap age limit and never
fetches an alternative checkpoint automatically. Missing or expired checkpoints,
invalid proofs, and unavailable RPCs block registry installs and report a recovery
error; the rest of Dappmanager remains available.

Direct-CID requests must match the manifest name/version's verified registry CID.
Unregistered releases must use the explicit developer-install flow. This change
also retires plain mirror downloads, including installations that previously had
the mirror enabled. Publisher signature requirements remain independent of chain
authorization.

The light-client build and offline proof tests run separately from the existing
JavaScript unit-test job on native amd64 and arm64 CI runners. To run them locally:

```sh
docker build --target update-light-client-tests -t dappmanager-verifier-tests .
yarn build
yarn workspace @dappnode/toolkit test
yarn workspace @dappnode/installer test
yarn workspace @dappnode/dappmanager test
```

## Getting Started

This repo is a single piece of Dappnode. To install and use Dappnode go to the [installation guide](https://docs.dappnode.io/docs/user/install/overview).

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You must have git, docker, and docker-compose in your environment to run this repo. To verify these are installed properly, run the following commands.

```bash
git --version
docker --version
docker-compose --version
```

Go to the [installation overview](https://docs.dappnode.io/docs/user/install/overview) in our documentation for more information.

### Installing

1. To get started, clone the project locally.

   ```bash
   $ git clone https://github.com/dappnode/DNP_DAPPMANAGER.git
   ```

2. Use node 20 or higher to run the project.

   ```bash
   $ nvm use 20
   ```

3. Install `yarn` globally.

   ```bash
   $ npm install -g yarn
   ```

4. Enable corepack and set yarn version berry

   ```bash
   $ corepack enable && yarn set version berry
   ```

5. Install the dependencies

   ```bash
   $ yarn
   ```

6. Build the project

   ```bash
   $ yarn build
   ```

The DNP_DAPPMANAGER expects to be in a Dappnode network to connect to its WAMP module, Ethereum node and IPFS node. If you wish to use a different providers for such services you can edit their urls in the [`packages/params/src/params.ts` file](packages/params/src/params.ts).

### Developing

There are 4 different developing modes:

1. Standalone UI: this mode allows developers to have a standalone UI with basic functionality, to develop and test UI elements without connecting to a DAppNode or a mock server. This is a fully static site that will be deployed to Netlify on every PR to speed up the reviewing process of PRs.

Netlify settings:

- Production branch: **master**
- Other branches: **v...** (e.g v0.2.41)

Netlify will deploy a static site on every PR against the mentioned PRs

```
cd packages/admin-ui
yarn mock-standalone
```

2. Server mock: this mode allows to simulate backend situations, such as cookies and sessions, alerts, or notifications. You should run the UI devserver and a mock backend server with:

```
cd packages/admin-ui
yarn server-mock
```

```
cd packages/admin-ui
yarn mock
```

3. Actual DAPPMANAGER: this mode will connect to your Dappnode's actual DAPPMANAGER, useful to develop and test functionality OS dependant such as the SSH manager, host password manager, etc. You must be connected to your Dappnode via VPN or WiFi.

```
cd packages/admin-ui
yarn start
```

_Note: This mode is not working at the moment since cross-domain cookies are not enabled._

4. Docker real-time development (recommended).

SSH into your Dappnode and clone this repo:

```bash
git clone https://github.com/dappnode/DNP_DAPPMANAGER
```

Open the directory where you cloned the repo using VS Code SSH extension (optional, but recommended)

Force remove Dappmanager container:

```bash
docker rm -f DAppNodeCore-dappmanager.dnp.dappnode.eth
```

Build and start dev Dappmanager:

```bash
docker-compose -f docker-compose-dev.yml up -d --build
```

After this, you will be able to access the dappmanager through http://my.dappnode/

_Note: To switch back to production Dappmanager, you will have to remove this container and run:_

```
docker-compose -f /usr/src/dappnode/DNCORE/docker-compose-dappmanager.yml up -d
```

### Distributing

Now, generate a tar.xz image ([get the xz library](https://tukaani.org/xz/)).

```bash
$ docker build --rm -f build/Dockerfile -t dappmanager.dnp.dappnode.eth:dev build
$ docker save dappmanager.dnp.dappnode.eth:dev | xz -9 > dappmanager.dnp.dappnode.eth_x.y.z.tar.xz
```

You can download the latest tar.xz version from here [releases](https://github.com/dappnode/DNP_DAPPMANAGER/releases).

## Contributing

Please read [CONTRIBUTING.md](https://github.com/dappnode) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/dappnode/DNP_DAPPMANAGER/tags).

## Authors

- **Eduardo Antuña Díez** - _Initial work_ - [eduadiez](https://github.com/eduadiez)
- **Pablo Mendez** - [pablomendez](https://github.com/pablomendezroyo)
- **DAppLion** - [dapplion](https://github.com/dapplion)

See also the list of [contributors](https://github.com/dappnode/DNP_DAPPMANAGER/contributors) who participated in this project.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details

## References

[git](https://git-scm.com/)

[docker](https://www.docker.com/)

[docker-compose](https://docs.docker.com/compose/)

```

```
