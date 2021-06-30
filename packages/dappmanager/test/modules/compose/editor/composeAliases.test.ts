import "mocha";
import { expect } from "chai";
import { ComposeFileEditor } from "../../../../src/modules/compose/editor";
import params from "../../../../src/params";
import { shellSafe } from "../../../testUtils";
import fs from "fs";
import { parseServiceNetworks } from "../../../../src/modules/compose/networks";

describe("compose service editor", () => {
  const exampleCompose = `
version: '3.5'
services:
  goerli-geth.dnp.dappnode.eth:
    container_name: DAppNodePackage-goerli-geth.dnp.dappnode.eth
    dns: 172.33.1.2
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

  const dnpName = "example";
  const serviceName = "goerli-geth.dnp.dappnode.eth";
  const dnpRepoExamplePath = process.cwd() + "/dnp_repo/example";

  before("Create random compose to be edited", async () => {
    // Create necessary dir
    await shellSafe(`mkdir ${dnpRepoExamplePath}`);
    // Create example compose
    fs.writeFileSync(
      `${dnpRepoExamplePath}/docker-compose.yml`,
      exampleCompose
    );
  });

  it("Should remove alias: example.dappnode", () => {
    editCompose(dnpName, serviceName, "remove");

    const composeAfter = fs.readFileSync(
      `${dnpRepoExamplePath}/docker-compose.yml`,
      "utf-8"
    );

    const composeExpected = `
version: '3.5'
services:
  goerli-geth.dnp.dappnode.eth:
    container_name: DAppNodePackage-goerli-geth.dnp.dappnode.eth
    dns: 172.33.1.2
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
    external: true
`;

    console.log(composeAfter);
    console.log(composeExpected);
    expect(composeAfter.trim()).to.equal(composeExpected.trim());
  });

  it("Should add alias: goerli-geth.dappnode", () => {
    editCompose(dnpName, serviceName, "add");

    const composeAfter = fs.readFileSync(
      `${dnpRepoExamplePath}/docker-compose.yml`,
      "utf-8"
    );

    const composeExpected = `
version: '3.5'
services:
  goerli-geth.dnp.dappnode.eth:
    container_name: DAppNodePackage-goerli-geth.dnp.dappnode.eth
    dns: 172.33.1.2
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
    external: true
`;
    expect(composeAfter.trim()).to.equal(composeExpected.trim());
  });

  afterEach(() => {
    // Overwrite the compose to be used in more tests
    fs.writeFileSync(
      `${dnpRepoExamplePath}/docker-compose.yml`,
      exampleCompose
    );
  });

  after("Remove setup", async () => {
    await shellSafe(`rm -rf ${dnpRepoExamplePath}`);
  });
});

// Function to avoid deduplication of code
function editCompose(
  dnpName: string,
  serviceName: string,
  option: "add" | "remove"
): void {
  const compose = new ComposeFileEditor(dnpName, false);

  const composeService = compose.services()[serviceName];
  const serviceNetworks = parseServiceNetworks(
    composeService.get().networks || {}
  );
  const serviceNetwork =
    serviceNetworks[params.DNP_PRIVATE_NETWORK_NAME] ?? null;

  if (option === "remove")
    composeService.removeNetworkAliases(
      params.DNP_PRIVATE_NETWORK_NAME,
      ["goerli-geth.dappnode"],
      serviceNetwork
    );
  else
    composeService.addNetworkAliases(
      params.DNP_PRIVATE_NETWORK_NAME,
      ["example.dappnode"],
      serviceNetwork
    );
  compose.write();
}
