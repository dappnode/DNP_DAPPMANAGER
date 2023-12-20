import "mocha";
import { expect } from "chai";
import {
  ComposeFileEditor,
  ComposeServiceEditor,
  parseServiceNetworks,
} from "../../src/index.js";
import { params } from "@dappnode/params";
import fs from "fs";
import path from "path";
import { GlobalEnvsPrefixed, ComposeServiceNetwork } from "@dappnode/common";

describe("compose service editor", () => {
  const exampleCompose = `
version: '3.5'
services:
  goerli-geth.dnp.dappnode.eth:
    container_name: DAppNodePackage-goerli-geth.dnp.dappnode.eth
    environment:
      - 'EXTRA_OPTIONS=--http.api eth,net,web3,txpool'
    image: 'goerli-geth.dnp.dappnode.eth:0.4.12'
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: '3'
    networks:
      dncore_network:
        aliases:
          - goerli-geth.dappnode
    ports:
      - '30303'
      - 30303/udp
      - 30304/udp
    restart: always
    volumes:
      - 'goerli:/goerli'
    labels:
      dappnode.dnp.dnpName: goerli-geth.dnp.dappnode.eth
      dappnode.dnp.version: 0.4.12
volumes:
  goerli: {}
networks:
  dncore_network:
    external: true
  `;

  // Example package
  const dnpName = "example";
  const serviceName = "goerli-geth.dnp.dappnode.eth";
  const dnpRepoExamplePath = path.join(process.cwd(), "dnp_repo", "example");
  console.log("dnpRepoExamplePath", dnpRepoExamplePath);

  before("Create random compose to be edited", async () => {
    // Create necessary dir
    fs.mkdirSync(dnpRepoExamplePath, { recursive: true });
    // Create example compose
    fs.writeFileSync(
      `${dnpRepoExamplePath}/docker-compose.yml`,
      exampleCompose
    );
  });

  describe("Add/remove network aliases", () => {
    it("Should remove alias: example.dappnode", () => {
      const { compose, composeService, serviceNetwork } = {
        ...getComposeEditors(dnpName, serviceName),
      };
      // Edit existing compose
      composeService.removeNetworkAliases(
        params.DOCKER_PRIVATE_NETWORK_NAME,
        ["goerli-geth.dappnode"],
        serviceNetwork
      );
      compose.write();

      // Get edited compose
      const composeAfter = fs.readFileSync(
        `${dnpRepoExamplePath}/docker-compose.yml`,
        "utf-8"
      );

      const composeExpected = `
version: '3.5'
services:
  goerli-geth.dnp.dappnode.eth:
    container_name: DAppNodePackage-goerli-geth.dnp.dappnode.eth
    environment:
      - 'EXTRA_OPTIONS=--http.api eth,net,web3,txpool'
    image: 'goerli-geth.dnp.dappnode.eth:0.4.12'
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: '3'
    networks:
      dncore_network:
        aliases: []
    ports:
      - '30303'
      - 30303/udp
      - 30304/udp
    restart: always
    volumes:
      - 'goerli:/goerli'
    labels:
      dappnode.dnp.dnpName: goerli-geth.dnp.dappnode.eth
      dappnode.dnp.version: 0.4.12
volumes:
  goerli: {}
networks:
  dncore_network:
    external: true`;

      expect(composeAfter.trim()).to.equal(composeExpected.trim());
    });

    it("Should add alias: goerli-geth.dappnode", () => {
      const { compose, composeService, serviceNetwork } = {
        ...getComposeEditors(dnpName, serviceName),
      };
      // Edit existing compose
      composeService.addNetworkAliases(
        params.DOCKER_PRIVATE_NETWORK_NAME,
        ["example.dappnode"],
        serviceNetwork
      );
      compose.write();

      // Get edited compose
      const composeAfter = fs.readFileSync(
        `${dnpRepoExamplePath}/docker-compose.yml`,
        "utf-8"
      );

      const composeExpected = `
version: '3.5'
services:
  goerli-geth.dnp.dappnode.eth:
    container_name: DAppNodePackage-goerli-geth.dnp.dappnode.eth
    environment:
      - 'EXTRA_OPTIONS=--http.api eth,net,web3,txpool'
    image: 'goerli-geth.dnp.dappnode.eth:0.4.12'
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: '3'
    networks:
      dncore_network:
        aliases:
          - goerli-geth.dappnode
          - example.dappnode
    ports:
      - '30303'
      - 30303/udp
      - 30304/udp
    restart: always
    volumes:
      - 'goerli:/goerli'
    labels:
      dappnode.dnp.dnpName: goerli-geth.dnp.dappnode.eth
      dappnode.dnp.version: 0.4.12
volumes:
  goerli: {}
networks:
  dncore_network:
    external: true`;
      expect(composeAfter.trim()).to.equal(composeExpected.trim());
    });
  });

  describe("Setglobal envs", () => {
    it("Should add global env file", () => {
      const { compose, composeService } = {
        ...getComposeEditors(dnpName, serviceName),
      };

      // Edit existing compose
      composeService.setGlobalEnvs({ all: true }, {}, false);
      compose.write();

      // Get edited compose
      const composeAfter = fs.readFileSync(
        `${dnpRepoExamplePath}/docker-compose.yml`,
        "utf-8"
      );

      const composeExpected = `
version: '3.5'
services:
  goerli-geth.dnp.dappnode.eth:
    container_name: DAppNodePackage-goerli-geth.dnp.dappnode.eth
    environment:
      - 'EXTRA_OPTIONS=--http.api eth,net,web3,txpool'
    image: 'goerli-geth.dnp.dappnode.eth:0.4.12'
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: '3'
    networks:
      dncore_network:
        aliases:
          - goerli-geth.dappnode
    ports:
      - '30303'
      - 30303/udp
      - 30304/udp
    restart: always
    volumes:
      - 'goerli:/goerli'
    labels:
      dappnode.dnp.dnpName: goerli-geth.dnp.dappnode.eth
      dappnode.dnp.version: 0.4.12
    env_file:
      - DNCORE/dnp.dappnode.global.env
volumes:
  goerli: {}
networks:
  dncore_network:
    external: true`;

      expect(composeAfter.trim()).to.equal(composeExpected.trim());
    });

    it("Should add selected global envs", () => {
      const { compose, composeService } = {
        ...getComposeEditors(dnpName, serviceName),
      };

      const GlobalEnvsPrefixed: GlobalEnvsPrefixed = {
        _DAPPNODE_GLOBAL_ACTIVE: "true",
        _DAPPNODE_GLOBAL_NO_NAT_LOOPBACK: "false",
      };

      // Edit existing compose
      composeService.setGlobalEnvs(
        [
          {
            envs: ["ACTIVE", "NO_NAT_LOOPBACK"],
            services: ["goerli-geth.dnp.dappnode.eth"],
          },
        ],
        GlobalEnvsPrefixed,
        false
      );
      compose.write();

      // Get edited compose
      const composeAfter = fs.readFileSync(
        `${dnpRepoExamplePath}/docker-compose.yml`,
        "utf-8"
      );

      const composeExpected = `
version: '3.5'
services:
  goerli-geth.dnp.dappnode.eth:
    container_name: DAppNodePackage-goerli-geth.dnp.dappnode.eth
    environment:
      - 'EXTRA_OPTIONS=--http.api eth,net,web3,txpool'
      - _DAPPNODE_GLOBAL_ACTIVE=true
      - _DAPPNODE_GLOBAL_NO_NAT_LOOPBACK=false
    image: 'goerli-geth.dnp.dappnode.eth:0.4.12'
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: '3'
    networks:
      dncore_network:
        aliases:
          - goerli-geth.dappnode
    ports:
      - '30303'
      - 30303/udp
      - 30304/udp
    restart: always
    volumes:
      - 'goerli:/goerli'
    labels:
      dappnode.dnp.dnpName: goerli-geth.dnp.dappnode.eth
      dappnode.dnp.version: 0.4.12
volumes:
  goerli: {}
networks:
  dncore_network:
    external: true`;

      expect(composeAfter.trim()).to.equal(composeExpected.trim());
    });
  });

  afterEach(() => {
    // Overwrite the compose to be used in more tests
    fs.writeFileSync(
      `${dnpRepoExamplePath}/docker-compose.yml`,
      exampleCompose
    );
  });
});

function getComposeEditors(
  dnpName: string,
  serviceName: string
): {
  compose: ComposeFileEditor;
  composeService: ComposeServiceEditor;
  serviceNetwork: ComposeServiceNetwork;
} {
  // Create compose editors
  const compose = new ComposeFileEditor(dnpName, false);
  const composeService = compose.services()[serviceName];
  const serviceNetworks = parseServiceNetworks(
    composeService.get().networks || {}
  );
  const serviceNetwork =
    serviceNetworks[params.DOCKER_PRIVATE_NETWORK_NAME] ?? null;
  return {
    compose,
    composeService,
    serviceNetwork,
  };
}
