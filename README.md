<p align="center"><a href="https://github.com/dappnode/DAppNode"><img width="400" title="DAPPMANAGER" src='banner-dappmanager.png' /></a></p>

The **DNP_DAPPMANAGER** handles the DAppNode core DNPs and any installed DNPs. It also performs maintenance checks.

- :bust_in_silhouette: For user / usage documentation go to the [user manual](https://dappnode.readthedocs.io/en/latest/user-manual.html#dappmanager)
- :wrench: For developers check the [technical documentation](build/src)
- :speech_balloon: For feedback and reporting problems please [submit an issue](https://github.com/dappnode/DNP_ADMIN/issues/new) or contact us on [RIOT•IM](https://riot.im/app/#/room/#DAppNode:matrix.org)

It is an AragonApp whose repo is deployed at this address: [0x0c564ca7b948008fb324268d8baedaeb1bd47bce](https://etherscan.io/address/0x0c564ca7b948008fb324268d8baedaeb1bd47bce) and whose ENS address is: [dappmanager.dnp.dappnode.eth](https://etherscan.io/enslookup?q=dappmanager.dnp.dappnode.eth])

## Getting Started

This repo is a single piece of DAppNode. To install and use DAppNode go to the [installation guide](https://github.com/dappnode/DAppNode/wiki/DAppNode-Installation-Guide).

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You must have git, docker and docker-compose in your environment to run this repo. To verify so, run the following commands.

```bash
git --version
docker --version
docker-compose --version
```

Go to the pre-requisites setup guide if you any command returned an error and need to install a pre-requisite.

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
