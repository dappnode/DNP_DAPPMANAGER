import "mocha";
import { expect } from "chai";
import { shellSafe } from "@dappnode/utils";
import fs from "fs";
import {
  ethereumClient,
  ComposeAliasEditorAction,
} from "../../../src/ethClient/index.js";
import { params } from "@dappnode/params";

// The following test will wite a compose with the alias fullnode.dappnode:
// 1. Then will remove such aslias and test it
// 2. With the existing edited compose will add back again the alias: fullnode.dappnode and test it

describe("Edit fullnode in eth client", () => {
  const composeWithFullnodeAlias = `
version: '3.5'
services:
  geth.dnp.dappnode.eth:
    container_name: DAppNodePackage-geth.dnp.dappnode.eth
    dns: 172.33.1.2
    environment:
      - 'EXTRA_OPTIONS=--http.api eth,net,web3,txpool'
    image: 'geth.dnp.dappnode.eth:0.4.12'
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: '3'
    networks:
      dncore_network:
        aliases:
          - geth.dappnode
          - fullnode.dappnode
    ports:
      - '30303'
      - 30303/udp
      - 30304/udp
    restart: always
    volumes:
      - 'data:/data'
    labels:
      dappnode.dnp.dnpName: geth.dnp.dappnode.eth
      dappnode.dnp.version: 0.4.12
volumes:
  data: {}
networks:
  dncore_network:
    external: true
`;

  const composeWithOutFullnodeAlias = `
version: '3.5'
services:
  geth.dnp.dappnode.eth:
    container_name: DAppNodePackage-geth.dnp.dappnode.eth
    dns: 172.33.1.2
    environment:
      - 'EXTRA_OPTIONS=--http.api eth,net,web3,txpool'
    image: 'geth.dnp.dappnode.eth:0.4.12'
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: '3'
    networks:
      dncore_network:
        aliases:
          - geth.dappnode
    ports:
      - '30303'
      - 30303/udp
      - 30304/udp
    restart: always
    volumes:
      - 'data:/data'
    labels:
      dappnode.dnp.dnpName: geth.dnp.dappnode.eth
      dappnode.dnp.version: 0.4.12
volumes:
  data: {}
networks:
  dncore_network:
    external: true
`;

  // Example package
  const dnpName = "geth.dnp.dappnode.eth";
  const serviceName = "geth.dnp.dappnode.eth";
  const dnpRepoExamplePath = `${process.cwd()}/dnp_repo/${dnpName}`;

  before("Create random compose to be edited", async () => {
    // Create necessary dir
    await shellSafe(`mkdir ${dnpRepoExamplePath}`);
    // Create example compose with fullnode
    fs.writeFileSync(
      `${dnpRepoExamplePath}/docker-compose.yml`,
      composeWithFullnodeAlias
    );
  });

  it("Should remove alias: fullnode.dappnode", () => {
    // Edit existing compose
    ethereumClient.editFullnodeAliasInCompose({
      action: ComposeAliasEditorAction.REMOVE,
      execClientDnpName: dnpName,
      execClientServiceName: serviceName,
      alias: params.FULLNODE_ALIAS,
    });

    // Get edited compose
    const composeAfter = fs.readFileSync(
      `${dnpRepoExamplePath}/docker-compose.yml`,
      "utf-8"
    );

    expect(composeAfter.trim()).to.equal(composeWithOutFullnodeAlias.trim());
  });

  it("Should add alias: fullnode.dappnode", () => {
    // Edit existing compose
    ethereumClient.editFullnodeAliasInCompose({
      action: ComposeAliasEditorAction.ADD,
      execClientDnpName: dnpName,
      execClientServiceName: serviceName,
      alias: params.FULLNODE_ALIAS,
    });

    // Get edited compose
    const composeAfter = fs.readFileSync(
      `${dnpRepoExamplePath}/docker-compose.yml`,
      "utf-8"
    );

    expect(composeAfter.trim()).to.equal(composeWithFullnodeAlias.trim());
  });

  after("Remove setup", async () => {
    await shellSafe(`rm -rf ${dnpRepoExamplePath}`);
  });
});
