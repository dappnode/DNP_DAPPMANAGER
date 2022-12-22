<p align="center"><a href="https://github.com/dappnode/DAppNode"><img width="400" title="DAPPMANAGER" src='banner-dappmanager.png' /></a></p>

[![Website dappnode.io](https://img.shields.io/badge/Website-dappnode.io-brightgreen.svg)](https://dappnode.io/)
[![Documentation Wiki](https://img.shields.io/badge/Documentation-Wiki-brightgreen.svg)](https://docs.dappnode.io)
[![GIVETH Campaign](https://img.shields.io/badge/GIVETH-Campaign-1e083c.svg)](https://donate.dappnode.io)
[![Discord DAppNode](https://img.shields.io/discord/747647430450741309?label=Discord&logo=Discord&style=plastic)](https://discord.gg/g9k6vkW)
[![Twitter Follow](https://img.shields.io/twitter/follow/espadrine.svg?style=social&label=Follow)](https://twitter.dappnode.io)

The **DNP_DAPPMANAGER** handles the DAppNode core DNPs and any user installed DNPs. It also performs maintenance checks.

- :bust_in_silhouette: For user / usage documentation go to the [user guide](https://dappnode.github.io/DAppNodeDocs/#i-am-a-user/)
- :wrench: For developers check the [technical documentation](https://dappnode.github.io/DAppNodeDocs/#i-am-a-developer)
- :speech_balloon: For feedback and reporting problems please [submit an issue](https://github.com/dappnode/dappnode/issues/new) or contact us on [Discord](https://discord.gg/g9k6vkW)

It is an AragonApp whose repo is deployed at this address: [0x0c564ca7b948008fb324268d8baedaeb1bd47bce](https://etherscan.io/address/0x0c564ca7b948008fb324268d8baedaeb1bd47bce) and whose ENS address is: [dappmanager.dnp.dappnode.eth](https://etherscan.io/enslookup?q=dappmanager.dnp.dappnode.eth])

## Getting Started

This repo is a single piece of DAppNode. To install and use DAppNode go to the [installation guide](https://github.com/dappnode/DAppNode/wiki/DAppNode-Installation-Guide).

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You must have git, docker, and docker-compose in your environment to run this repo. To verify these are installed properly, run the following commands.

```bash
git --version
docker --version
docker-compose --version
```

Go to the [pre-requisites setup](https://docs.dappnode.io/user/quick-start/core/installation/#prerequisites) in our installation guide if any of the above commands return an error and need to be installed or has its own unmet dependencies.

### Installing

To get started, clone the project locally.

```
$ git clone https://github.com/dappnode/DNP_DAPPMANAGER.git
```

To develop locally, cd into the src folder and start the nodejs application

```
cd build/src
npm i
npm start
```

The DNP_DAPPMANAGER expects to be in a DAppNode network to connect to its WAMP module, Ethereum node and IPFS node. If you wish to use a different providers for such services you can edit their urls in the [`build/src/src/params.js` file](build/src/src/params.js).

### Building

After making sure that the nodejs app runs successfully on it own and passes the tests `npm test`, you can dockerize the package.

```
docker-compose build
docker-compose up -d
docker-compose logs -f
```

### Developing

Before choosing any of the following options for development, remember to run:
```
yarn
yarn generate
```

There are 3 different developing modes:

1. Standalone UI: this mode allows developers to have a standalone UI with basic functionality, to develop and test UI elements without connecting to a DAppNode or a mock server. This is a fully static site that will be deployed to Netlify on every PR to speed up the reviewing process of PRs.

Netlify settings:

- Production branch: **master**
- Other branches: **v...** (e.g v0.2.41)

Netlify will deploy an static site on every PR against the mentioned PRs

```
cd packages/admin-ui
yarn mock-standalone
```

2. Server mock: this mode allow to simulate backend situations, such as cookies and sessions, alerts, or notifications. You should run the UI devserver and a mock backend server with:

```
cd packages/admin-ui
yarn server-mock
```

```
cd packages/admin-ui
yarn mock
```

3. Actual DAPPMANAGER: this mode will connect to your DAppNode's actual DAPPMANAGER, useful to develop and test functionality OS dependant such as the SSH manager, host password manager, etc. You must be connected to your DAppNode via VPN or WIFI.

```
cd packages/admin-ui
yarn start
```

_Note: This mode is not working a the moment since cross-domain cookies are not enabled._

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
